# Util Layer

The Util layer is a space that can contain items other than the predefined layer items. Pure functions that are not dependent on a specific domain, such as date formatting and regular expression validation, are primarily located here.

Overly fragmented layers can increase the learning curve and ambiguity of the architecture. However, if necessary, new layers can be defined and used in consultation with team members, provided that the unidirectional layer principle (upper layers refer to lower layers) is strictly observed.

## Conceptual Example

### Date Formatting Util

The Util layer is the lowest layer and must be an independent module that does not refer to any upper layers (Pages, Components, States, APIs).

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