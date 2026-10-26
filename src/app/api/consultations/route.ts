import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const appointmentId = searchParams.get('appointmentId');

    const consultations = await prisma.consultation.findMany({
      where: {
        hospitalId: user.hospitalId,
        ...(patientId ? { patientId } : {}),
        ...(doctorId ? { doctorId } : {}),
        ...(appointmentId ? { appointmentId } : {})
      },
      include: {
        patient: true,
        appointment: true,
        prescriptions: {
          include: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ consultations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const body = await req.json();
    const {
      appointmentId,
      patientId,
      doctorId,
      symptoms,
      vitalsBp,
      vitalsHr,
      vitalsTemp,
      vitalsSpo2,
      vitalsRr,
      vitalsHeight,
      vitalsWeight,
      vitalsBmi,
      painScore,
      clinicalNotes,
      hpi,
      physicalExam,
      diagnosis,
      secondaryDiagnosis,
      certainty,
      medicines,
      prescriptionInstructions,
      labOrders,
      followUp
    } = body;

    if (!patientId || !symptoms || !diagnosis) {
      return NextResponse.json({ error: 'Patient ID, symptoms, and diagnosis are required' }, { status: 400 });
    }

    const docId = doctorId || user.id;

    // Comprehensive clinical notes formatting
    let detailedNotes = clinicalNotes || '';
    if (hpi) detailedNotes += `\n\n[HPI]: ${hpi}`;
    if (physicalExam) detailedNotes += `\n\n[Physical Examination]: ${physicalExam}`;
    if (secondaryDiagnosis) detailedNotes += `\n\n[Secondary Diagnosis]: ${secondaryDiagnosis}`;
    if (certainty) detailedNotes += `\n[Diagnostic Certainty]: ${certainty}`;
    if (painScore !== undefined && painScore !== null) detailedNotes += `\n[Pain Score]: ${painScore}/10`;
    if (vitalsHeight && vitalsWeight) detailedNotes += `\n[Anthropometrics]: Height ${vitalsHeight}cm, Weight ${vitalsWeight}kg, BMI ${vitalsBmi || 'N/A'}`;

    const consultation = await prisma.consultation.create({
      data: {
        appointmentId: appointmentId || null,
        patientId,
        doctorId: docId,
        hospitalId: user.hospitalId,
        symptoms,
        vitalsBp: vitalsBp || null,
        vitalsHr: vitalsHr || null,
        vitalsTemp: vitalsTemp || null,
        vitalsSpo2: vitalsSpo2 || null,
        vitalsRr: vitalsRr || null,
        clinicalNotes: detailedNotes.trim(),
        diagnosis,
        status: 'COMPLETED'
      }
    });

    let updatedAppointment = null;
    if (appointmentId) {
      const existingApt = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      let history = [];
      try {
        if (existingApt?.historyJson) {
          history = JSON.parse(existingApt.historyJson);
        }
      } catch (e) {
        history = [];
      }

      history.push({
        from: existingApt?.status || 'IN_CONSULTATION',
        to: 'COMPLETED',
        actor: user.email,
        role: user.role,
        action: 'complete_consultation',
        reason: diagnosis,
        timestamp: new Date().toISOString()
      });

      updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'COMPLETED',
          diagnosisNotes: diagnosis,
          completedAt: new Date(),
          historyJson: JSON.stringify(history)
        },
        include: { patient: true, doctor: true, department: true }
      });
      eventBroadcaster.broadcast('APPOINTMENT_UPDATED', updatedAppointment, user.hospitalId);
    }

    // 1. Create Prescription if medicines provided
    let createdPrescription = null;
    if (Array.isArray(medicines) && medicines.length > 0) {
      const rxCount = await prisma.prescription.count({ where: { hospitalId: user.hospitalId } });
      const rxCode = `RX-${new Date().getFullYear()}-${String(rxCount + 1).padStart(5, '0')}`;

      createdPrescription = await prisma.prescription.create({
        data: {
          prescriptionCode: rxCode,
          consultationId: consultation.id,
          patientId,
          doctorId: docId,
          hospitalId: user.hospitalId,
          status: 'ISSUED',
          instructions: prescriptionInstructions || 'Take medications as directed by physician.',
          items: {
            create: medicines.map((m: any) => ({
              medicineName: m.name || m.medicineName || 'Medication',
              strength: m.strength || 'Standard',
              dosage: m.dosage || '1 tablet',
              route: m.route || 'Oral',
              frequency: m.frequency || 'Once daily',
              durationDays: parseInt(String(m.durationDays)) || 5,
              quantity: parseInt(String(m.quantity)) || 10,
              instructions: m.instructions || 'After meals',
              foodRelation: m.foodRelation || 'After food'
            }))
          }
        },
        include: { items: true, patient: true }
      });
      eventBroadcaster.broadcast('PRESCRIPTION_CREATED', createdPrescription, user.hospitalId);
    }

    // 2. Create Lab Orders if requested
    const createdLabOrders = [];
    if (Array.isArray(labOrders) && labOrders.length > 0) {
      for (const lo of labOrders) {
        if (lo.testId) {
          const loCount = await prisma.labOrder.count({ where: { hospitalId: user.hospitalId } });
          const orderCode = `LAB-${new Date().getFullYear()}-${String(loCount + 1).padStart(5, '0')}`;
          const newOrder = await prisma.labOrder.create({
            data: {
              orderCode,
              patientId,
              doctorId: docId,
              hospitalId: user.hospitalId,
              testId: lo.testId,
              testName: lo.testName || 'Lab Investigation',
              priority: lo.priority || 'ROUTINE',
              status: 'ORDERED'
            },
            include: { test: true }
          });
          createdLabOrders.push(newOrder);
          eventBroadcaster.broadcast('LAB_ORDER_CREATED', newOrder, user.hospitalId);
        }
      }
    }

    // 3. Create Follow-up Appointment if requested
    let createdFollowUp = null;
    if (followUp?.required && followUp.date) {
      const aptCount = await prisma.appointment.count({ where: { hospitalId: user.hospitalId } });
      const aptCode = `NEXO-APT-${new Date().getFullYear()}-${String(aptCount + 1).padStart(5, '0')}`;
      const slot = followUp.timeSlot || '10:00 AM';

      try {
        createdFollowUp = await prisma.appointment.create({
          data: {
            appointmentCode: aptCode,
            patientId,
            doctorId: docId,
            hospitalId: user.hospitalId,
            date: followUp.date,
            timeSlot: slot,
            durationMinutes: 30,
            visitType: followUp.visitType || 'IN_PERSON',
            type: 'FOLLOW_UP',
            status: 'BOOKED',
            reason: followUp.notes || `Follow-up consultation for ${diagnosis}`,
            historyJson: JSON.stringify([{
              from: 'NONE',
              to: 'BOOKED',
              actor: user.email,
              role: user.role,
              action: 'schedule_followup',
              reason: 'Scheduled at conclusion of clinical encounter',
              timestamp: new Date().toISOString()
            }])
          },
          include: { patient: true, doctor: true }
        });
        eventBroadcaster.broadcast('APPOINTMENT_CREATED', createdFollowUp, user.hospitalId);
      } catch (errSlot) {
        console.warn('Slot already taken or conflict for follow up, creating with next available suffix:', errSlot);
      }
    }

    // 4. Record Central Medical Record Timeline
    const vitalsSummary = `BP: ${vitalsBp || 'N/A'}, HR: ${vitalsHr || 'N/A'} bpm, Temp: ${vitalsTemp || 'N/A'}°F, SpO2: ${vitalsSpo2 || 'N/A'}%`;
    await prisma.medicalRecord.create({
      data: {
        patientId,
        hospitalId: user.hospitalId,
        doctorId: docId,
        recordType: 'CONSULTATION',
        title: `Clinical Consultation - ${diagnosis}`,
        summary: `Symptoms: ${symptoms}. Diagnosis: ${diagnosis}${secondaryDiagnosis ? ` | Secondary: ${secondaryDiagnosis}` : ''}`,
        details: `Vitals: ${vitalsSummary}\nBMI: ${vitalsBmi || 'N/A'} | Pain Score: ${painScore ?? 'N/A'}/10\n\nNotes:\n${detailedNotes}`
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'CONSULTATION_RECORD',
      resource: `Consultation:${consultation.id}`,
      details: {
        patientId,
        diagnosis,
        appointmentId,
        prescriptionCode: createdPrescription?.prescriptionCode,
        labOrdersCount: createdLabOrders.length,
        hasFollowUp: !!createdFollowUp
      }
    });

    return NextResponse.json({
      message: 'Consultation completed and saved successfully',
      consultation,
      appointment: updatedAppointment,
      prescription: createdPrescription,
      labOrders: createdLabOrders,
      followUpAppointment: createdFollowUp
    }, { status: 201 });
  } catch (err: any) {
    console.error('Save consultation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
