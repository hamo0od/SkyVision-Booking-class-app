-- Remove calibration-related columns and add checkout system

-- Create tool_checkouts table
CREATE TABLE IF NOT EXISTS tool_checkouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL,
    user_id UUID NOT NULL,
    checkout_date TIMESTAMP NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP NOT NULL,
    return_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'CHECKED_OUT',
    notes TEXT,
    issued_by_id UUID,
    returned_by_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_tool_checkout_tool FOREIGN KEY (tool_id) REFERENCES tools(id),
    CONSTRAINT fk_tool_checkout_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Update tools table to remove calibration and add max checkout days
ALTER TABLE tools 
DROP COLUMN IF EXISTS calibration_due_date,
DROP COLUMN IF EXISTS current_holder_id,
DROP COLUMN IF EXISTS issued_date;

ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS max_checkout_days INTEGER DEFAULT 7;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tool_checkouts_tool_id ON tool_checkouts(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_checkouts_user_id ON tool_checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_checkouts_status ON tool_checkouts(status);
CREATE INDEX IF NOT EXISTS idx_tool_checkouts_due_date ON tool_checkouts(due_date);

-- Insert some sample checkout data
INSERT INTO tool_checkouts (tool_id, user_id, checkout_date, due_date, status, notes)
SELECT 
    t.id,
    u.id,
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '2 days',
    'CHECKED_OUT',
    'Regular maintenance checkout'
FROM tools t
CROSS JOIN users u
WHERE t.id = (SELECT id FROM tools LIMIT 1)
AND u.role = 'TECHNICIAN'
LIMIT 1;

-- Insert an overdue checkout for testing
INSERT INTO tool_checkouts (tool_id, user_id, checkout_date, due_date, status, notes)
SELECT 
    t.id,
    u.id,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '3 days',
    'OVERDUE',
    'Overdue checkout - needs follow up'
FROM tools t
CROSS JOIN users u
WHERE t.id = (SELECT id FROM tools OFFSET 1 LIMIT 1)
AND u.role = 'TECHNICIAN'
LIMIT 1;
