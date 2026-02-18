import { RULE_FLA001 } from "./rule-fla001-extension-suffix.mjs";
import { RULE_FLA002 } from "./rule-fla002-interface-placement.mjs";
import { RULE_FLA003 } from "./rule-fla003-layer-reference.mjs";
import { RULE_FLA004 } from "./rule-fla004-no-barrel-index.mjs";
import { RULE_FLA005 } from "./rule-fla005-nested-layer-directory.mjs";
import { RULE_FLA006 } from "./rule-fla006-single-use-global-module.mjs";
import { RULE_FLA007 } from "./rule-fla007-kebab-case-naming.mjs";
import { RULE_FLA008 } from "./rule-fla008-layer-directory-naming.mjs";
import { RULE_FLA009 } from "./rule-fla009-layer-module-grouping.mjs";
import { RULE_FLA010 } from "./rule-fla010-page-only-router-hook.mjs";

export const FILE_RULES = [
  RULE_FLA001,
  RULE_FLA002,
  RULE_FLA003,
  RULE_FLA004,
  RULE_FLA010,
];

export const REPO_RULES = [
  RULE_FLA005,
  RULE_FLA006,
  RULE_FLA007,
  RULE_FLA008,
  RULE_FLA009,
];
