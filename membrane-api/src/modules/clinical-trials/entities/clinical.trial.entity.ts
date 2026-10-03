import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";



@Entity('clinical_trials')
export class ClinicalTrial{
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  trialHexId: string

  @Column({length: 20})
  diseaseCode: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

}