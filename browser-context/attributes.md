# Data Attributes Reference

This document lists all data attributes used by the CD Form Library and their purposes.

## Form Initialization

### `data-cd-form`
**Value:** `"true"`
**Applied to:** `<form>`
**Purpose:** Marks a form for initialization by the CD Form Library. Only forms with this attribute will be enhanced.

## Input Formatting

### `data-input`
**Value:** Format string (e.g., `"date:mmddyyyy"`, `"time:hhmm am"`, `"number"`, `"percent"`, `"country-code"`)
**Applied to:** `<input>` or `<select>`
**Purpose:** Applies automatic formatting/masking to input fields or auto-populates select dropdowns. Supports date, time, number, percent, and country code formats.

**Supported formats:**

**Date/Time Formats:**
- `date:mmddyyyy` - MM/DD/YYYY date format
- `date:ddmmyyyy` - DD/MM/YYYY date format
- `time:hhmm` or `time:hhmm am` - 12-hour time format with AM
- `time:hhmm pm` - 12-hour time format with PM
- `time:h:mm` or `time:h:mm am` - Flexible hour time with AM
- `time:h:mm pm` - Flexible hour time with PM
- `time:hh:mm` or `time:hh:mm am` - 24-hour or 12-hour format
- `time:hh:mm pm` - 12-hour format defaulting to PM

**Number Formats:**
- `number` - Number formatting with thousands separators
- `percent` - Percentage formatting (0-100%)

**Country Code Formats (for `<select>` elements):**
- `country-code` - Just the code (e.g., `+1`)
- `country-code:iso` - Code with ISO (e.g., `+1 (US)`)
- `country-code:flag` - Flag emoji with code (e.g., `🇺🇸 +1`)
- `country-code:name` - Code with country name (e.g., `+1 United States`)
- `country-code:flag-iso` - Flag, code, and ISO (e.g., `🇺🇸 +1 (US)`)
- `country-code:flag-name` - Flag, code, and name (e.g., `🇺🇸 +1 United States`)

**Example:**
```html
<select data-input="country-code:flag-iso" name="country-code">
  <!-- Auto-populated with: 🇺🇸 +1 (US), 🇬🇧 +44 (GB), etc. -->
</select>
```

## Conditional Visibility

### `data-show-when`
**Value:** `"<field-name>=<value>"`
**Applied to:** Any container element
**Purpose:** Shows/hides the element based on the value of a form field (radio, checkbox, select, or input). Format is `field-name=expected-value`.

**Example:** `data-show-when="entity-type=individual"` shows the element when the field named "entity-type" has value "individual".

## Auto-Fill (Copy Field Values)

### `data-cd-auto-source`
**Value:** Group identifier (string)
**Applied to:** Container element wrapping source fields
**Purpose:** Marks a container as the source of field values that can be copied to destination fields when a trigger is activated.

### `data-cd-auto-dest`
**Value:** Group identifier (matches `data-cd-auto-source` value)
**Applied to:** Container element wrapping destination fields
**Purpose:** Marks a container as the destination for auto-filled field values. Fields within this container will receive values from the matching source container.

### `data-cd-auto-trigger`
**Value:** Group identifier (matches `data-cd-auto-source` and `data-cd-auto-dest` values)
**Applied to:** Checkbox or radio input element
**Purpose:** When checked, triggers copying of all matching field values from source to destination containers. When unchecked, clears all destination fields.

### `data-cd-field-key`
**Value:** Field identifier (string)
**Applied to:** Input, select, or textarea elements within source and destination containers
**Purpose:** Identifies matching fields between source and destination containers. Fields with the same `data-cd-field-key` value will be paired for auto-fill, regardless of their `name` attributes.

**Example:**
```html
<!-- Source fields -->
<div data-cd-auto-source="contact-info">
  <input name="primary-first-name" data-cd-field-key="first-name" value="John">
  <input name="primary-last-name" data-cd-field-key="last-name" value="Doe">
</div>

<!-- Trigger -->
<label>
  <input type="checkbox" data-cd-auto-trigger="contact-info">
  Use same contact information
</label>

<!-- Destination fields -->
<div data-cd-auto-dest="contact-info">
  <input name="secondary-first-name" data-cd-field-key="first-name">
  <input name="secondary-last-name" data-cd-field-key="last-name">
</div>
```

When the checkbox is checked, "John" and "Doe" will be copied to the secondary fields. When unchecked, the secondary fields will be cleared.

## Skip Navigation

### `data-cd-skip`
**Value:** Target step's `data-answer` value (e.g., `"step-11"` or `"summary-page"`)
**Applied to:** Button or link element
**Purpose:** Allows users to skip to a specific form step in a Tryformly multi-step form. Works by matching the value to a step's `data-answer` attribute. Automatically handles step visibility, updates step counter, and scrolls to the target step.

**Example:**
```html
<a data-cd-skip="step-11" href="#" class="button is-secondary">Skip</a>
```

This will navigate directly to the step with `data-answer="step-11"` when clicked.

## Dynamic Rows (Repeaters)

### `data-cd-repeat-group`
**Value:** Group identifier (string)
**Applied to:** Container element
**Purpose:** Defines a container for repeatable row groups. The value identifies which add/remove buttons control this group.

### `data-cd-repeat-template`
**Value:** Empty string or omitted
**Applied to:** Row element inside repeat group
**Purpose:** Marks a row as the template for cloning. This row is hidden and used to create new rows.

### `data-cd-repeat-row`
**Value:** Any value (typically empty string)
**Applied to:** Row element inside repeat group
**Purpose:** Marks an element as a data row within a repeat group (not the template).

### `data-cd-add-row` or `data-cd-repeat-add`
**Value:** Group identifier (matches `data-cd-repeat-group` value)
**Applied to:** Button or clickable element
**Purpose:** Triggers adding a new row to the specified repeat group. Can be used interchangeably.

### `data-cd-remove-row` or `data-cd-repeat-remove`
**Value:** Group identifier (optional)
**Applied to:** Button or clickable element inside a row
**Purpose:** Triggers removal of the row containing this button. Can be used interchangeably.

### `data-cd-name-pattern`
**Value:** Pattern string with `{i}` and `{field}` placeholders
**Applied to:** Repeat group container
**Purpose:** Defines the naming pattern for form fields in repeated rows. Default is `{groupName}[{i}][{field}]`.

### `data-cd-repeat-name`
**Value:** Base field name
**Applied to:** Input/select/textarea inside repeat row
**Purpose:** Indicates the base name of a field that should be indexed when rows are added/removed. The actual `name` attribute will be generated using the pattern.

### `data-original-id`
**Value:** Original element ID
**Applied to:** Elements with `id` attribute in repeat rows
**Purpose:** Internal attribute used to track original IDs for proper indexing when rows are cloned.

### `data-original-for`
**Value:** Original label target ID
**Applied to:** `<label>` elements in repeat rows
**Purpose:** Internal attribute used to track original `for` attribute values for proper label/input associations.

## Summary Fields

### `data-cd-summary-for`
**Value:** Group identifier (matches `data-cd-repeat-group` value)
**Applied to:** Summary container element
**Purpose:** Links a summary container to a repeat group, creating summary rows that mirror the data rows.

### `data-cd-summary-template`
**Value:** Empty string or omitted
**Applied to:** Summary row template
**Purpose:** Marks a summary row as a template for cloning. Hidden and used to create summary rows.

### `data-summary-row`
**Value:** Empty string or omitted
**Applied to:** Generated summary row
**Purpose:** Marks an element as a generated summary row (not the template).

### `data-cd-input-field`
**Value:** Field name or pattern with `{i}` placeholder
**Applied to:** Summary output element
**Purpose:** Links a summary element to a form field, automatically syncing the displayed value. Supports patterns like `person-name-{i}` for repeating fields.

## Branch-Based Visibility (CD Form Library + Tryformly)

### `data-cd-branch`
**Value:** Branch group identifier
**Applied to:** `.step_wrapper` elements
**Purpose:** Identifies a form step as belonging to a conditional branch path.

### `data-cd-summary-branch`
**Value:** `"<branch-group>:<branch-value>"`
**Applied to:** Summary sections
**Purpose:** Shows/hides summary sections based on which branch path the user selected. Format is `branch-group:branch-value`.

---

## Tryformly Attributes

These attributes are part of the Tryformly library for Webflow multi-step forms. The CD Form Library integrates with Tryformly.

### Core Multi-Step Form Attributes

#### `data-form="multistep"`
**Applied to:** `<form>` element
**Purpose:** Enables Tryformly multi-step functionality on the form.

#### `data-form="step"`
**Applied to:** Step container `<div>`
**Purpose:** Marks an individual step within the multi-step form.

#### `data-form="next-btn"`
**Applied to:** Button element
**Purpose:** Defines the button that navigates to the next form step.

#### `data-form="back-btn"`
**Applied to:** Button element
**Purpose:** Defines the button that navigates to the previous form step.

#### `data-form="submit-btn"`
**Applied to:** Button element
**Purpose:** Marks the final form submission button.

#### `data-form="submit"`
**Applied to:** Step wrapper
**Purpose:** Handles multiple submit buttons in different steps.

### Display & Powerup Attributes

#### `data-text="current-step"`
**Applied to:** Text element
**Purpose:** Dynamically displays the current step number.

#### `data-text="total-steps"`
**Applied to:** Text element
**Purpose:** Dynamically displays the total number of steps in the form.

#### `data-checkbox="n"`
**Applied to:** Step `<div>`
**Value:** Number (e.g., `"2"` for minimum 2 selections)
**Purpose:** Requires a minimum number of checkbox selections before allowing progression to next step.

#### `data-phone-autoformat="{format}"`
**Applied to:** Phone number `<input>`
**Value:** Formatting pattern (e.g., `"xxx-xxx-xxxx"`)
**Purpose:** Automatically formats phone number inputs as user types.

### Pro Features

#### `data-edit-step="n"`
**Applied to:** Button element
**Value:** Step number (e.g., `"2"`)
**Purpose:** Allows navigation directly to a specific step for editing previously entered data.

#### `data-memory="true"`
**Applied to:** `<form>` element
**Purpose:** Automatically saves form input data and restores it on page reload.

#### `data-query-param="true"`
**Applied to:** `<form>` element
**Purpose:** Enables pre-filling form inputs using URL query parameters.

### FormlyLogic Attributes (Conditional Logic)

#### `data-logic-extra`
**Applied to:** `<form>` element
**Value:** `"true"`
**Purpose:** Enables conditional logic functionality on the Formly form.

#### `data-go-to`
**Applied to:** Radio buttons or step wrappers
**Value:** Branch/step name (string)
**Purpose:** Directs the form to show a specific element/branch on the next step based on user selection.

#### `data-answer`
**Applied to:** Step wrapper elements
**Value:** Branch/step name (empty string `""` for first step)
**Purpose:** Connects branches in a flowchart-like logic flow. Links a step to the corresponding `data-go-to` value.

#### `data-skip-to`
**Applied to:** Radio buttons or step wrappers
**Value:** Step number (e.g., `"5"`)
**Purpose:** Allows users to skip ahead to any specified step in the form.

#### `data-card`
**Applied to:** First step or steps without inputs
**Value:** `"true"`
**Purpose:** Marks a step as a card/informational step that doesn't require input validation.

#### `data-submit-show`
**Applied to:** Next button
**Value:** `"true"`
**Purpose:** Allows both submit and next buttons to appear on the same step.

## Tooltips

### `data-tt`
**Value:** Unique key
**Applied to:** Tooltip trigger element
**Purpose:** In split-mode tooltips, identifies which tooltip component this trigger should activate.

### `data-tt-for`
**Value:** Unique key (matches `data-tt` value)
**Applied to:** Tooltip component (`.tooltip_component`)
**Purpose:** In split-mode tooltips, identifies which trigger activates this tooltip.

### `data-tt-group`
**Value:** Any value
**Applied to:** Container element
**Purpose:** Defines a scoping container for split-mode tooltips, limiting the search for matching triggers/components.

## Internal/System Attributes

### `data-cd-repeat-template` (on cloned elements)
**Purpose:** Internal marker removed from cloned template rows to convert them to active data rows.

### `data-form="step"`
**Applied to:** Form step containers
**Purpose:** Identifies form steps for multi-step form navigation monitoring.

## CSS Classes Used (for context)

While not data attributes, these CSS classes are referenced by the library:

- `.tooltip_component` - Tooltip container
- `.tooltip_element-wrapper` - Tooltip trigger wrapper
- `.tooltip_tooltip-wrapper` - Tooltip panel/content
- `.tooltip_pointer` - Tooltip arrow/pointer
- `.step_wrapper` - Form step wrapper (Tryformly)
