import Audit from '../../../src/lib/models/Audit';

const createAuditEntry = async (auditInfo: {
  id?: string;
  user?: string;
  ip?: string;
  base_id?: string;
  project_id?: string;
  fk_model_id?: string;
  row_id?: string;
  op_type?: string;
  op_sub_type?: string;
  status?: string;
  description?: string;
  details?: string;
  created_at: Date;
  updated_at: Date;
}) => {
  return await Audit.insert(auditInfo)
}

export {
  createAuditEntry
}