-- RightsGuard AI Database Schema
-- This file contains the complete database schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_status VARCHAR(20) DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro')),
    script_generations_used INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incident reports table
CREATE TABLE incident_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location TEXT,
    state VARCHAR(50),
    notes TEXT,
    audio_url TEXT,
    video_url TEXT,
    share_card_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal content table
CREATE TABLE legal_content (
    content_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(50) NOT NULL,
    rights_info TEXT NOT NULL,
    script_to_say TEXT,
    script_not_to_say TEXT,
    language VARCHAR(20) DEFAULT 'english' CHECK (language IN ('english', 'spanish')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(state, language)
);

-- Indexes for better performance
CREATE INDEX idx_incident_reports_user_id ON incident_reports(user_id);
CREATE INDEX idx_incident_reports_created_at ON incident_reports(created_at DESC);
CREATE INDEX idx_legal_content_state_language ON legal_content(state, language);
CREATE INDEX idx_users_email ON users(email);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_content ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Incident reports policies
CREATE POLICY "Users can view own incidents" ON incident_reports
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own incidents" ON incident_reports
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own incidents" ON incident_reports
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own incidents" ON incident_reports
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Legal content is readable by all authenticated users
CREATE POLICY "Authenticated users can view legal content" ON legal_content
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can modify legal content (for admin updates)
CREATE POLICY "Service role can modify legal content" ON legal_content
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incident_reports_updated_at BEFORE UPDATE ON incident_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for incident recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('incident-recordings', 'incident-recordings', false);

-- Storage policies
CREATE POLICY "Users can upload their own recordings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'incident-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own recordings" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'incident-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own recordings" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'incident-recordings' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Seed data for legal content (basic rights information for all 50 states)
INSERT INTO legal_content (state, rights_info, language) VALUES
('Alabama', 'In Alabama, you have the following rights during police encounters:

• Right to remain silent under the Fifth Amendment
• Right to refuse searches without a warrant (Fourth Amendment)
• Right to ask if you are free to leave
• Right to record police interactions in public spaces
• Right to an attorney if arrested
• Alabama follows "stop and identify" laws - you may be required to provide identification if reasonably suspected of a crime

Important: Alabama has specific laws regarding recording police. While generally legal in public, be aware of your surroundings and local ordinances.', 'english'),

('Alaska', 'In Alaska, you have the following rights during police encounters:

• Right to remain silent under the Fifth Amendment
• Right to refuse searches without a warrant (Fourth Amendment)
• Right to ask if you are free to leave
• Right to record police interactions in public spaces
• Right to an attorney if arrested
• Alaska has strong privacy protections under its state constitution

Alaska does not have "stop and identify" laws, so you are not required to provide identification unless arrested.', 'english'),

('Arizona', 'In Arizona, you have the following rights during police encounters:

• Right to remain silent under the Fifth Amendment
• Right to refuse searches without a warrant (Fourth Amendment)
• Right to ask if you are free to leave
• Right to record police interactions in public spaces
• Right to an attorney if arrested
• Arizona has "stop and identify" laws - you may be required to provide identification if reasonably suspected of a crime

Note: Arizona has specific laws regarding immigration status inquiries during lawful stops.', 'english'),

('California', 'In California, you have the following rights during police encounters:

• Right to remain silent under the Fifth Amendment
• Right to refuse searches without a warrant (Fourth Amendment)
• Right to ask if you are free to leave
• Right to record police interactions in public spaces (protected under CA law)
• Right to an attorney if arrested
• California does not have "stop and identify" laws

California has strong protections for recording police and sanctuary state policies that limit cooperation with federal immigration enforcement.', 'english'),

('New York', 'In New York, you have the following rights during police encounters:

• Right to remain silent under the Fifth Amendment
• Right to refuse searches without a warrant (Fourth Amendment)
• Right to ask if you are free to leave
• Right to record police interactions in public spaces
• Right to an attorney if arrested
• New York does not have "stop and identify" laws

New York has specific protections against discriminatory policing and strong privacy rights.', 'english');

-- Add Spanish translations for key states
INSERT INTO legal_content (state, rights_info, language) VALUES
('California', 'En California, tienes los siguientes derechos durante encuentros policiales:

• Derecho a permanecer en silencio bajo la Quinta Enmienda
• Derecho a rechazar registros sin una orden judicial (Cuarta Enmienda)
• Derecho a preguntar si eres libre de irte
• Derecho a grabar interacciones policiales en espacios públicos (protegido bajo la ley de CA)
• Derecho a un abogado si eres arrestado
• California no tiene leyes de "parar e identificar"

California tiene fuertes protecciones para grabar a la policía y políticas de estado santuario que limitan la cooperación con la aplicación de inmigración federal.', 'spanish'),

('New York', 'En Nueva York, tienes los siguientes derechos durante encuentros policiales:

• Derecho a permanecer en silencio bajo la Quinta Enmienda
• Derecho a rechazar registros sin una orden judicial (Cuarta Enmienda)
• Derecho a preguntar si eres libre de irte
• Derecho a grabar interacciones policiales en espacios públicos
• Derecho a un abogado si eres arrestado
• Nueva York no tiene leyes de "parar e identificar"

Nueva York tiene protecciones específicas contra el policiamiento discriminatorio y fuertes derechos de privacidad.', 'spanish');
