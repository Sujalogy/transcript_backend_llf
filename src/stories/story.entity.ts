// story.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  code: string;

  @Column({ type: 'text', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  original_text: string;

  @Column({ type: 'text', nullable: true })
  display_html: string;

  @Column({ type: 'jsonb', nullable: true })
  speechmark: any;

  @Column({ type: 'text', nullable: true })
  audio_file: string;

  @Column({ type: 'text', nullable: false })
  language: string;

  @Column({ type: 'jsonb', nullable: true })
  config_json: any;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'text', nullable: true })
  cover_image: string;

  @Column({ type: 'text', nullable: true })
  category: string; // ✅ New column
}
