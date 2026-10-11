/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as coordination_delivery from "../coordination/delivery.js";
import type * as coordination_domain from "../coordination/domain.js";
import type * as coordination_inbound from "../coordination/inbound.js";
import type * as coordination_outbound from "../coordination/outbound.js";
import type * as coordination_policy from "../coordination/policy.js";
import type * as coordination_provider from "../coordination/provider.js";
import type * as coordination_tables from "../coordination/tables.js";
import type * as coordination_transport from "../coordination/transport.js";
import type * as coordination_validators from "../coordination/validators.js";
import type * as coordination_webhook from "../coordination/webhook.js";
import type * as http from "../http.js";
import type * as inspections_access from "../inspections/access.js";
import type * as inspections_analyze from "../inspections/analyze.js";
import type * as inspections_contract from "../inspections/contract.js";
import type * as inspections_documents from "../inspections/documents.js";
import type * as inspections_findings from "../inspections/findings.js";
import type * as inspections_provider from "../inspections/provider.js";
import type * as inspections_uploadHttp from "../inspections/uploadHttp.js";
import type * as inspections_uploads from "../inspections/uploads.js";
import type * as inspections_validators from "../inspections/validators.js";
import type * as remediation_access from "../remediation/access.js";
import type * as remediation_engine from "../remediation/engine.js";
import type * as remediation_graphs from "../remediation/graphs.js";
import type * as remediation_nodes from "../remediation/nodes.js";
import type * as remediation_transitions from "../remediation/transitions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "coordination/delivery": typeof coordination_delivery;
  "coordination/domain": typeof coordination_domain;
  "coordination/inbound": typeof coordination_inbound;
  "coordination/outbound": typeof coordination_outbound;
  "coordination/policy": typeof coordination_policy;
  "coordination/provider": typeof coordination_provider;
  "coordination/tables": typeof coordination_tables;
  "coordination/transport": typeof coordination_transport;
  "coordination/validators": typeof coordination_validators;
  "coordination/webhook": typeof coordination_webhook;
  http: typeof http;
  "inspections/access": typeof inspections_access;
  "inspections/analyze": typeof inspections_analyze;
  "inspections/contract": typeof inspections_contract;
  "inspections/documents": typeof inspections_documents;
  "inspections/findings": typeof inspections_findings;
  "inspections/provider": typeof inspections_provider;
  "inspections/uploadHttp": typeof inspections_uploadHttp;
  "inspections/uploads": typeof inspections_uploads;
  "inspections/validators": typeof inspections_validators;
  "remediation/access": typeof remediation_access;
  "remediation/engine": typeof remediation_engine;
  "remediation/graphs": typeof remediation_graphs;
  "remediation/nodes": typeof remediation_nodes;
  "remediation/transitions": typeof remediation_transitions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
