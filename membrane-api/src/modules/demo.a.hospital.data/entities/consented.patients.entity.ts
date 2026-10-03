import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity('demo_a_hospital_consented_patients')
export class DemoAHospitalConsentedPatients {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  patientId: string

  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column()
  age: number

  @Column()
  diseaseCode: string

  @CreateDateColumn()
  createdAt: Date

}