import { column, Schema, Table } from "@powersync/web";

const identityColumns = {
  organization_id: column.text,
  updated_at: column.text,
};

export const contourSchema = new Schema({
  organizations: new Table({ name: column.text }, { localOnly: false }),
  properties: new Table({ ...identityColumns, title: column.text, suburb: column.text, status: column.text, listing_type: column.text, price: column.real, latitude: column.real, longitude: column.real, photos_json: column.text }),
  clients: new Table({ ...identityColumns, name: column.text, phone: column.text, email: column.text, status: column.text, assigned_agent_id: column.text, notes: column.text }),
  visits: new Table({ ...identityColumns, property_id: column.text, client_id: column.text, agent_id: column.text, scheduled_at: column.text, status: column.text, notes: column.text }),
  inquiries: new Table({ ...identityColumns, client_id: column.text, property_id: column.text, agent_id: column.text, status: column.text, notes: column.text }),
  deals: new Table({ ...identityColumns, property_id: column.text, client_id: column.text, agent_id: column.text, stage: column.text, next_action_at: column.text }),
  follow_ups: new Table({ ...identityColumns, entity_type: column.text, entity_id: column.text, assigned_agent_id: column.text, due_at: column.text, status: column.text, notes: column.text }),
  sync_mutations: Table.createLocalOnly({ organization_id: column.text, user_id: column.text, entity_type: column.text, entity_id: column.text, operation: column.text, payload_json: column.text, status: column.text, created_at: column.text, retry_count: column.integer, last_error: column.text }),
  sync_conflicts: Table.createLocalOnly({ organization_id: column.text, entity_type: column.text, entity_id: column.text, local_json: column.text, server_json: column.text, status: column.text, created_at: column.text }),
});
