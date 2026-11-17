import type {
  CreateProposalInput,
  Proposal,
  RetireProposalResponse,
  UpdateProposalInput,
} from '../types/proposal';

export interface ProposalGateway {
  create(token: string, input: CreateProposalInput): Promise<Proposal>;
  update(token: string, proposalId: string, input: UpdateProposalInput): Promise<Proposal>;
  retire(token: string, proposalId: string): Promise<RetireProposalResponse>;
}
