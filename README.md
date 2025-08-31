# CD Form Library

A Webflow-native form enhancement library that adds advanced functionality to forms using simple HTML data attributes. No complex JavaScript required - just add attributes to your HTML elements.

## Quick Start

Add this script tag to your Webflow site (in Project Settings > Custom Code > Footer Code):

```html
<script src="https://unpkg.com/cd-form-library@0.1.109/dist/browser.js"></script>
```

Then add `data-cd-form="true"` to your form element:

```html
<form data-cd-form="true">
  <!-- Your form content -->
</form>
```

## Features

- **Input Formatting**: Automatic date, time, and percentage formatting with masks
- **Dynamic Form Visibility**: Show/hide form sections based on user selections  
- **Dynamic Rows**: Add/remove repeatable form sections with automatic field naming
- **Summary Fields**: Real-time summary display of form data
- **Branch-Based Visibility**: Show different summary sections based on user choices

## Input Formatting

Add input masks for dates, times, and percentages using the `data-input` attribute.

### Date Formatting

```html
<!-- MM/DD/YYYY format -->
<input type="text" data-input="date:mmddyyyy" placeholder="MM/DD/YYYY">

<!-- DD/MM/YYYY format -->
<input type="text" data-input="date:ddmmyyyy" placeholder="DD/MM/YYYY">
```

### Time Formatting

```html
<!-- 12-hour format with AM/PM -->
<input type="text" data-input="time:hhmm am" placeholder="HH:MM AM">
<input type="text" data-input="time:hhmm pm" placeholder="HH:MM PM">
```

### Percentage Formatting

```html
<!-- Automatic % symbol -->
<input type="text" data-input="percent" placeholder="Enter percentage">
```

## Dynamic Form Visibility

Show or hide form sections based on radio button or select field values.

### Basic Setup

```html
<!-- Radio buttons -->
<input type="radio" name="business-type" value="llc"> LLC
<input type="radio" name="business-type" value="corporation"> Corporation

<!-- Section that shows only when "LLC" is selected -->
<div data-show-when="business-type=llc">
  <h3>LLC Information</h3>
  <!-- LLC-specific form fields -->
</div>

<!-- Section that shows only when "Corporation" is selected -->
<div data-show-when="business-type=corporation">
  <h3>Corporation Information</h3>
  <!-- Corporation-specific form fields -->
</div>
```

### Works With Any Form Element

```html
<!-- Select dropdown -->
<select name="state">
  <option value="ca">California</option>
  <option value="ny">New York</option>
</select>

<!-- Show only for California -->
<div data-show-when="state=ca">
  <p>California-specific information</p>
</div>
```

## Dynamic Rows (Repeatable Sections)

Create forms where users can add/remove multiple rows of the same data.

### Basic Structure

```html
<!-- Container for repeatable rows -->
<div data-cd-repeat-group="team-members">
  
  <!-- Template row (will be hidden and used for cloning) -->
  <div data-cd-repeat-template data-cd-repeat-row="team-members" style="display: none;">
    <input type="text" data-cd-repeat-name="member_name" placeholder="Name">
    <input type="email" data-cd-repeat-name="member_email" placeholder="Email">
    <button type="button" data-cd-repeat-remove="team-members">Remove</button>
  </div>
  
  <!-- First visible row -->
  <div data-cd-repeat-row="team-members">
    <input type="text" data-cd-repeat-name="member_name" placeholder="Name">
    <input type="email" data-cd-repeat-name="member_email" placeholder="Email">
    <button type="button" data-cd-repeat-remove="team-members">Remove</button>
  </div>
  
</div>

<!-- Add button (can be placed anywhere) -->
<button type="button" data-cd-repeat-add="team-members">Add Team Member</button>
```

### Field Naming

The library automatically generates unique field names:
- `member_name` becomes `member_name-1`, `member_name-2`, etc.
- `member_email` becomes `member_email-1`, `member_email-2`, etc.

### Row Limits

- **Maximum**: 5 rows per group
- **Minimum**: 1 row (cannot remove the last row)
- Add button automatically disables at 5 rows
- Add button re-enables when rows are removed

### Alternative Button Patterns

```html
<!-- Generic add/remove buttons (will work with any group) -->
<button data-cd-add-row>Add Row</button>
<button data-cd-remove-row>Remove</button>
```

## Summary Fields

Display real-time summaries of form data anywhere in your form.

### Basic Summary Field

```html
<!-- Form input -->
<input type="text" name="company_name" placeholder="Company Name">

<!-- Summary display (updates automatically) -->
<span data-cd-input-field="company_name">Not specified</span>
```

### Summary Containers

Group related summary fields:

```html
<!-- Summary container for a specific dynamic row group -->
<div data-cd-summary-for="team-members">
  
  <!-- Template for each row's summary -->
  <div data-cd-summary-template style="display: none;">
    <p>Name: <span data-cd-input-field="member_name-{i}">Not specified</span></p>
    <p>Email: <span data-cd-input-field="member_email-{i}">Not specified</span></p>
  </div>
  
</div>
```

The `{i}` placeholder gets replaced with row numbers (1, 2, 3, etc.).

### Radio Button Summaries

```html
<!-- Radio buttons -->
<input type="radio" name="business_type" value="LLC"> LLC
<input type="radio" name="business_type" value="Corporation"> Corporation

<!-- Summary -->
<p>Business Type: <span data-cd-input-field="business_type">Not selected</span></p>
```

## Multi-Step Forms & Logic Branching

For complex multi-step forms with conditional logic, we recommend using [TryFormly](https://tryformly.com) in combination with this library.

### TryFormly Integration

**TryFormly** provides:
- Multi-step form navigation
- Conditional logic and branching
- Form validation and progress tracking
- Step-by-step user experience

**CD Form Library** enhances TryFormly with:
- Advanced input formatting
- Dynamic repeatable sections
- Real-time summary fields
- Branch-aware summary visibility

### Setup with TryFormly

1. **Install TryFormly** on your Webflow site following their documentation
2. **Add CD Form Library** script after TryFormly:

```html
<!-- TryFormly script (install per their instructions) -->
<script src="https://cdn.tryformly.com/..."></script>

<!-- CD Form Library -->
<script src="https://unpkg.com/cd-form-library@0.1.109/dist/browser.js"></script>
```

3. **Enable both systems** on your form:

```html
<form data-cd-form="true" data-formly="true">
  <!-- Your multi-step form content -->
</form>
```

### Branch-Based Summary Visibility

When using TryFormly, the library automatically detects step visibility changes and shows appropriate summary sections.

#### Step Wrappers with TryFormly

```html
<!-- TryFormly step with branch data -->
<div class="step_wrapper" data-cd-branch="business-type" data-answer="llc" style="display: none;">
  <!-- LLC form content -->
  <h3>LLC Information</h3>
  
  <!-- Dynamic rows work within TryFormly steps -->
  <div data-cd-repeat-group="llc-members">
    <div data-cd-repeat-template data-cd-repeat-row="llc-members" style="display: none;">
      <input type="text" data-cd-repeat-name="member_name" placeholder="Member Name">
      <input type="text" data-cd-repeat-name="ownership" data-input="percent" placeholder="Ownership %">
      <button type="button" data-cd-repeat-remove="llc-members">Remove</button>
    </div>
    
    <div data-cd-repeat-row="llc-members">
      <input type="text" data-cd-repeat-name="member_name" placeholder="Member Name">
      <input type="text" data-cd-repeat-name="ownership" data-input="percent" placeholder="Ownership %">
      <button type="button" data-cd-repeat-remove="llc-members">Remove</button>
    </div>
  </div>
  
  <button type="button" data-cd-repeat-add="llc-members">Add Member</button>
</div>

<div class="step_wrapper" data-cd-branch="business-type" data-answer="corporation" style="display: none;">
  <!-- Corporation form content -->
  <h3>Corporation Information</h3>
  <input type="text" name="incorporation_date" data-input="date:mmddyyyy" placeholder="Incorporation Date">
</div>
```

#### Branch-Specific Summaries

```html
<!-- Summary step - shows different content based on user's path -->
<div class="step_wrapper" data-step="summary">
  <h2>Form Summary</h2>
  
  <!-- Shows only when LLC branch was selected -->
  <div data-cd-summary-branch="business-type:llc" style="display: none;">
    <h3>LLC Summary</h3>
    <p>Business Type: LLC</p>
    
    <div data-cd-summary-for="llc-members">
      <h4>LLC Members:</h4>
      <div data-cd-summary-template style="display: none;">
        <p><span data-cd-input-field="member_name-{i}">Not specified</span> - <span data-cd-input-field="ownership-{i}">Not specified</span></p>
      </div>
    </div>
  </div>
  
  <!-- Shows only when Corporation branch was selected -->
  <div data-cd-summary-branch="business-type:corporation" style="display: none;">
    <h3>Corporation Summary</h3>
    <p>Business Type: Corporation</p>
    <p>Incorporation Date: <span data-cd-input-field="incorporation_date">Not specified</span></p>
  </div>
</div>
```

### Best Practices with TryFormly

**Step Organization:**
- Use TryFormly for navigation and validation
- Use CD Form Library for enhanced field functionality
- Place dynamic rows within appropriate TryFormly steps
- Add summary steps at the end with branch-specific content

**Data Persistence:**
- TryFormly handles step navigation and data persistence
- CD Form Library maintains summary synchronization across steps
- Both systems work together seamlessly

**Validation:**
- TryFormly handles form validation and step progression
- CD Form Library provides input formatting and masks
- Both systems respect each other's validation states

## Complete Example

```html
<form data-cd-form="true">
  
  <!-- Business Type Selection -->
  <h3>What type of business do you have?</h3>
  <input type="radio" name="business_type" value="llc"> LLC
  <input type="radio" name="business_type" value="corporation"> Corporation
  
  <!-- LLC-specific section -->
  <div data-show-when="business_type=llc">
    <h3>LLC Members</h3>
    
    <div data-cd-repeat-group="llc-members">
      <!-- Template row -->
      <div data-cd-repeat-template data-cd-repeat-row="llc-members" style="display: none;">
        <input type="text" data-cd-repeat-name="member_name" placeholder="Member Name">
        <input type="text" data-cd-repeat-name="ownership" data-input="percent" placeholder="Ownership %">
        <button type="button" data-cd-repeat-remove="llc-members">Remove</button>
      </div>
      
      <!-- First row -->
      <div data-cd-repeat-row="llc-members">
        <input type="text" data-cd-repeat-name="member_name" placeholder="Member Name">
        <input type="text" data-cd-repeat-name="ownership" data-input="percent" placeholder="Ownership %">
        <button type="button" data-cd-repeat-remove="llc-members">Remove</button>
      </div>
    </div>
    
    <button type="button" data-cd-repeat-add="llc-members">Add Member</button>
  </div>
  
  <!-- Corporation-specific section -->
  <div data-show-when="business_type=corporation">
    <h3>Corporation Details</h3>
    <input type="text" name="incorporation_date" data-input="date:mmddyyyy" placeholder="Incorporation Date">
  </div>
  
  <!-- Summary Section -->
  <div class="summary">
    <h3>Form Summary</h3>
    <p>Business Type: <span data-cd-input-field="business_type">Not selected</span></p>
    
    <!-- LLC Summary -->
    <div data-cd-summary-for="llc-members">
      <h4>LLC Members:</h4>
      <div data-cd-summary-template style="display: none;">
        <p><span data-cd-input-field="member_name-{i}">Not specified</span> - <span data-cd-input-field="ownership-{i}">Not specified</span></p>
      </div>
    </div>
    
    <!-- Corporation Summary -->
    <p>Incorporation Date: <span data-cd-input-field="incorporation_date">Not specified</span></p>
  </div>
  
</form>
```

## Events

The library dispatches custom events that you can listen for:

```javascript
// When a row is added
document.addEventListener('cd:row:added', (event) => {
  console.log('Row added to group:', event.detail.groupName);
  console.log('Row index:', event.detail.rowIndex);
});

// When a row is removed
document.addEventListener('cd:row:removed', (event) => {
  console.log('Row removed from group:', event.detail.groupName);
});

// When input formatting is applied
document.addEventListener('cd:inputformat:bound', (event) => {
  console.log('Input formatting applied to:', event.target);
});

// When input format validation fails
document.addEventListener('cd:inputformat:invalid', (event) => {
  console.log('Invalid input format:', event.target);
});

// When form wrapper visibility changes
document.addEventListener('form-wrapper-visibility:shown', (event) => {
  console.log('Section shown:', event.target);
});

document.addEventListener('form-wrapper-visibility:hidden', (event) => {
  console.log('Section hidden:', event.target);
});
```

## Webflow Integration Tips

### CSS Classes

Add these CSS classes to your Webflow elements for better styling:

```css
/* Hide remove buttons on first rows if desired */
.dynamic-row:first-child [data-cd-remove-row],
.dynamic-row:first-child [data-cd-repeat-remove] {
  display: none;
}

/* Style for rows being added */
.visible-row {
  opacity: 1;
  transition: opacity 0.3s ease;
}

/* Style for disabled add buttons */
[data-cd-repeat-add][style*="pointer-events: none"] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Form Submission

When the form is submitted, all field names will include their row suffixes:

```
member_name-1=John Doe
member_email-1=john@example.com
member_name-2=Jane Smith  
member_email-2=jane@example.com
ownership-1=50%
ownership-2=50%
```

### Debugging

Enable debug mode to see detailed console logs:

```javascript
// Via URL parameter
// Add ?cd-debug=true to your page URL

// Via localStorage (persists across page loads)
localStorage.setItem('cd-debug', 'true');
```

## Version Information

Current version: 0.1.109

## Browser Support

- Chrome 80+
- Firefox 75+  
- Safari 13+
- Edge 80+

## License

MIT License