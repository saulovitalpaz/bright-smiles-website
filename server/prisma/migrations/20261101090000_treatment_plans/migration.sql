CREATE TABLE "ClinicalProcedure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pricingUnit" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "conditionTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClinicalProcedure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TreatmentPlan" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "sourceAppointmentId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'awaiting_authorization',
    "notes" TEXT,
    "paymentTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TreatmentPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TreatmentPlan_sourceAppointmentId_fkey" FOREIGN KEY ("sourceAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TreatmentPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TreatmentPlanItem" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "procedureId" INTEGER,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pricingUnit" TEXT NOT NULL,
    "conditionType" TEXT,
    "phase" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quotedTotal" DECIMAL(12,2) NOT NULL,
    "authorizedTotal" DECIMAL(12,2),
    "toothNumber" INTEGER,
    "targets" JSONB,
    "notes" TEXT,
    "clinicalStatus" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TreatmentPlanItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TreatmentPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TreatmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TreatmentPlanItem_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "ClinicalProcedure"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TreatmentPlanItem_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "TreatmentPlanItem_unitPrice_check" CHECK ("unitPrice" >= 0),
    CONSTRAINT "TreatmentPlanItem_quotedTotal_check" CHECK ("quotedTotal" >= 0),
    CONSTRAINT "TreatmentPlanItem_authorizedTotal_check" CHECK ("authorizedTotal" IS NULL OR ("authorizedTotal" >= 0 AND "authorizedTotal" <= "quotedTotal"))
);

CREATE TABLE "TreatmentPlanPayment" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TreatmentPlanPayment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TreatmentPlanPayment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TreatmentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TreatmentPlanPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TreatmentPlanPayment_amount_check" CHECK ("amount" > 0)
);

ALTER TABLE "Appointment" ADD COLUMN "treatmentPlanId" INTEGER;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "TreatmentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinanceTransaction" ADD COLUMN "treatmentPlanPaymentId" INTEGER;
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_treatmentPlanPaymentId_fkey" FOREIGN KEY ("treatmentPlanPaymentId") REFERENCES "TreatmentPlanPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "TreatmentPlanPayment_idempotencyKey_key" ON "TreatmentPlanPayment"("idempotencyKey");
CREATE UNIQUE INDEX "FinanceTransaction_treatmentPlanPaymentId_key" ON "FinanceTransaction"("treatmentPlanPaymentId");
CREATE INDEX "ClinicalProcedure_active_category_idx" ON "ClinicalProcedure"("active", "category");
CREATE INDEX "TreatmentPlan_patientId_createdAt_idx" ON "TreatmentPlan"("patientId", "createdAt");
CREATE INDEX "TreatmentPlan_sourceAppointmentId_idx" ON "TreatmentPlan"("sourceAppointmentId");
CREATE INDEX "TreatmentPlan_status_validUntil_idx" ON "TreatmentPlan"("status", "validUntil");
CREATE INDEX "TreatmentPlanItem_planId_phase_idx" ON "TreatmentPlanItem"("planId", "phase");
CREATE INDEX "TreatmentPlanItem_procedureId_idx" ON "TreatmentPlanItem"("procedureId");
CREATE INDEX "TreatmentPlanPayment_planId_receivedAt_idx" ON "TreatmentPlanPayment"("planId", "receivedAt");
CREATE INDEX "Appointment_treatmentPlanId_idx" ON "Appointment"("treatmentPlanId");

CREATE TABLE "ClinicalConditionGroup" (
 "key" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE "ClinicalConditionDefinition" (
 "key" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "groupKey" TEXT NOT NULL,
 "active" BOOLEAN NOT NULL DEFAULT false,
 CONSTRAINT "ClinicalConditionDefinition_groupKey_fkey" FOREIGN KEY ("groupKey") REFERENCES "ClinicalConditionGroup"("key") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ClinicalConditionDefinition_groupKey_active_idx" ON "ClinicalConditionDefinition"("groupKey", "active");
INSERT INTO "ClinicalConditionGroup" ("key", "name") VALUES ('achado', 'Achados');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('carie', 'carie', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('lesao_carie_inicial', 'lesao carie inicial', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('infiltracao', 'infiltracao', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('fratura', 'fratura', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('trinca', 'trinca', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('desgaste', 'desgaste', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('abrasao', 'abrasao', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('erosao', 'erosao', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('abfracao', 'abfracao', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('mancha', 'mancha', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('hipoplasia', 'hipoplasia', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('sensibilidade', 'sensibilidade', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('mobilidade', 'mobilidade', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('furca', 'furca', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('retracao_gengival', 'retracao gengival', 'achado');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('dente_ausente', 'dente ausente', 'achado');
INSERT INTO "ClinicalConditionGroup" ("key", "name") VALUES ('restauracao', 'Restaurações');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('resina_composta', 'resina composta', 'restauracao');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('amalgama', 'amalgama', 'restauracao');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('ionomero_vidro', 'ionomero vidro', 'restauracao');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('restauracao_provisoria', 'restauracao provisoria', 'restauracao');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('selante', 'selante', 'restauracao');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('inlay', 'inlay', 'restauracao');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('onlay', 'onlay', 'restauracao');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('overlay', 'overlay', 'restauracao');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('faceta', 'faceta', 'restauracao');
INSERT INTO "ClinicalConditionGroup" ("key", "name") VALUES ('endodontia', 'Endodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('tratamento_endodontico', 'tratamento endodontico', 'endodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('retratamento', 'retratamento', 'endodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('obturacao_radicular', 'obturacao radicular', 'endodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('lesao_periapical', 'lesao periapical', 'endodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('pino_intrarradicular', 'pino intrarradicular', 'endodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('nucleo', 'nucleo', 'endodontia');
INSERT INTO "ClinicalConditionGroup" ("key", "name") VALUES ('protese', 'Próteses');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('coroa_total', 'coroa total', 'protese');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('coroa_parcial', 'coroa parcial', 'protese');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('coroa_provisoria', 'coroa provisoria', 'protese');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('coroa_sobre_implante', 'coroa sobre implante', 'protese');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('implante', 'implante', 'protese');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('ponte_fixa', 'ponte fixa', 'protese');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('protese_removivel', 'protese removivel', 'protese');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('elemento_pontico', 'elemento pontico', 'protese');
INSERT INTO "ClinicalConditionGroup" ("key", "name") VALUES ('periodontiaCirurgia', 'Periodontia e cirurgia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('gengivectomia', 'gengivectomia', 'periodontiaCirurgia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('enxerto', 'enxerto', 'periodontiaCirurgia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('cirurgia_periodontal', 'cirurgia periodontal', 'periodontiaCirurgia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('exodontia_indicada', 'exodontia indicada', 'periodontiaCirurgia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('exodontia_executada', 'exodontia executada', 'periodontiaCirurgia');
INSERT INTO "ClinicalConditionGroup" ("key", "name") VALUES ('ortodontia', 'Ortodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('bracket', 'bracket', 'ortodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('banda', 'banda', 'ortodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('contencao', 'contencao', 'ortodontia');
INSERT INTO "ClinicalConditionDefinition" ("key", "name", "groupKey") VALUES ('aparelho', 'aparelho', 'ortodontia');
