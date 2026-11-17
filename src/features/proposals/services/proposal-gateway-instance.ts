import { appEnv } from '../../../shared/config/env';
import { HttpProposalGateway } from './http-proposal-gateway';
import type { ProposalGateway } from './proposal-gateway';

export const proposalGateway: ProposalGateway = new HttpProposalGateway(appEnv.apiBaseUrl);
