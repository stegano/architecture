# Util Layer

The Util Layer is a space that can include items other than those defined in the predefined layer items. Pure functions that are not dependent on a specific domain, such as date formatting and regular expression validation, are primarily located here.

An overly granular layer can increase the learning curve and ambiguity of the architecture. However, if necessary, new layers can be defined and used in consultation with the team, provided that the unidirectional layer principle (higher layers refer to lower layers) is strictly adhered to.

## Conceptual Examples

### Date Formatting Util

The Util Layer is the lowest layer and must be an independent module that does not reference any higher layers (Pages, Components, States, APIs).

```ts
// Util
// File Path: _utils/date/formatter.ts

import { format } from "date-fns"; // External library references are allowed

// Convert date to YYYY-MM-DD format
export const toYMD = (date: Date | number): string => {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
};
```