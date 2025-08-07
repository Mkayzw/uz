-- Enable RLS for agent_properties table
ALTER TABLE agent_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their assigned properties" 
ON agent_properties
FOR SELECT USING (
  agent_id = auth.uid()
);

CREATE POLICY "Managers can manage agent-property assignments"
ON agent_properties
FOR ALL USING (
  EXISTS (
    SELECT 1 
    FROM properties
    WHERE properties.manager_id = auth.uid()
    AND properties.id = agent_properties.property_id
  )
);