import type {
  AcceptProposalResponse,
  CreateProposalInput,
  Proposal,
  RetireProposalResponse,
  UpdateProposalInput,
} from '../types/proposal';

export interface ProposalGateway {
  create(token: string, input: CreateProposalInput): Promise<Proposal>;
  update(token: string, proposalId: string, input: UpdateProposalInput): Promise<Proposal>;
  retire(token: string, proposalId: string): Promise<RetireProposalResponse>;
  listReceived(token: string, solicitudId: string): Promise<Proposal[]>;
  accept(token: string, proposalId: string): Promise<AcceptProposalResponse>;
}
