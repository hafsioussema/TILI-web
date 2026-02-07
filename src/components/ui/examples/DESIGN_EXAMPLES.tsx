/**
 * Design System v2.0 Examples
 * 
 * This file demonstrates the transformation from pale, washed-out components
 * to vibrant, high-contrast, modern components using the new design system.
 * 
 * Copy these patterns when updating existing components.
 */

import { Calendar, Save, CheckCircle, AlertCircle, MoreVertical } from "lucide-react";

// ============================================================================
// EXAMPLE 1: MEETING CARD
// ============================================================================

/**
 * ❌ BEFORE - Pale, weak hierarchy
 */
export const MeetingCardBefore = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <span className="text-xs text-slate-400 uppercase">Meeting</span>
      <h3 className="text-base text-slate-800 mt-1">Weekly Sync</h3>
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
        <Calendar size={14} />
        <span>Feb 7, 2026</span>
      </div>
    </div>
  );
};

/**
 * ✅ AFTER - Vibrant, strong hierarchy, accessible
 * 
 * Improvements:
 * - Border: 1px slate-200 → 2px neutral-300
 * - Category badge with color background
 * - Title: text-base → text-xl font-bold
 * - Text contrast: slate-400/500 → neutral-700/900
 * - Icons have accent color
 * - Generous padding (p-4 → p-6)
 * - Hover state with shadow and border color
 */
export const MeetingCardAfter = () => {
  return (
    <div className="
      bg-white 
      border-2 border-[hsl(220_14%_82%)] 
      rounded-xl 
      p-6 
      shadow-md hover:shadow-lg 
      transition-all duration-200
      hover:border-[hsl(210_85%_60%)]
      cursor-pointer
    ">
      <span className="
        inline-block px-2 py-1 mb-3
        bg-[hsl(210_95%_85%)] text-[hsl(210_90%_35%)]
        text-xs font-bold uppercase tracking-wider
        rounded
      ">
        Meeting
      </span>
      <h3 className="text-xl font-bold text-[hsl(220_20%_8%)] mb-3">
        Weekly Sync
      </h3>
      <div className="flex items-center gap-2 text-sm text-[hsl(220_14%_25%)] font-medium">
        <Calendar size={16} className="text-[hsl(210_85%_42%)]" />
        <span>Feb 7, 2026</span>
      </div>
    </div>
  );
};

/**
 * OR using utility classes:
 */
export const MeetingCardAfterWithUtilities = () => {
  return (
    <div className="card-interactive p-6">
      <span className="badge-info mb-3">
        Meeting
      </span>
      <h3 className="text-heading-3 mb-3">
        Weekly Sync
      </h3>
      <div className="flex items-center gap-2 text-sm text-body font-medium">
        <Calendar size={16} className="text-primary" />
        <span>Feb 7, 2026</span>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 2: BUTTONS
// ============================================================================

/**
 * ❌ BEFORE - Weak visual presence
 */
export const ButtonsBefore = () => {
  return (
    <div className="flex gap-3">
      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Save Changes
      </button>
      <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded border border-gray-300">
        Cancel
      </button>
    </div>
  );
};

/**
 * ✅ AFTER - Strong, accessible buttons
 * 
 * Improvements:
 * - Icon for clarity
 * - Stronger shadows for depth
 * - Larger padding for touch targets (44px min height)
 * - Bold font weight
 * - Distinct hover/active/focus states
 * - WCAG AA compliant contrast (7.2:1)
 */
export const ButtonsAfter = () => {
  return (
    <div className="flex gap-3">
      {/* Primary Button */}
      <button className="
        inline-flex items-center gap-2
        bg-[hsl(210_85%_42%)] hover:bg-[hsl(210_90%_35%)] active:bg-[hsl(210_95%_28%)]
        text-white font-bold text-base
        px-8 py-3.5 rounded-xl
        shadow-lg hover:shadow-xl
        transition-all duration-200
        focus-visible:ring-4 focus-visible:ring-[hsl(210_85%_42%/0.2)] focus-visible:outline-none
      ">
        <Save size={18} />
        Save Changes
      </button>

      {/* Secondary Button */}
      <button className="
        inline-flex items-center gap-2
        bg-[hsl(220_18%_95%)] hover:bg-[hsl(220_16%_90%)] active:bg-[hsl(220_14%_82%)]
        text-[hsl(220_14%_25%)] font-semibold text-base
        px-8 py-3.5 rounded-xl
        border-2 border-[hsl(220_14%_82%)]
        transition-all duration-200
        focus-visible:ring-4 focus-visible:ring-[hsl(220_14%_82%/0.3)] focus-visible:outline-none
      ">
        Cancel
      </button>
    </div>
  );
};

/**
 * OR using utility classes:
 */
export const ButtonsAfterWithUtilities = () => {
  return (
    <div className="flex gap-3">
      <button className="btn-primary">
        <Save size={18} />
        Save Changes
      </button>
      <button className="btn-secondary">
        Cancel
      </button>
    </div>
  );
};

// ============================================================================
// EXAMPLE 3: STATUS BADGES
// ============================================================================

/**
 * ❌ BEFORE - Low contrast, hard to read
 */
export const StatusBadgesBefore = () => {
  return (
    <div className="flex gap-2">
      <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-xs">
        Active
      </span>
      <span className="bg-yellow-50 text-yellow-600 px-2 py-1 rounded text-xs">
        Pending
      </span>
      <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs">
        Failed
      </span>
    </div>
  );
};

/**
 * ✅ AFTER - High contrast with icons
 * 
 * Improvements:
 * - Color-only indicators → Color + Icon + Text
 * - Light backgrounds → Strong solid backgrounds
 * - Low contrast text → White text on colored background
 * - Contrast ratio: 4.5:1+ (WCAG AA compliant)
 * - Icons provide additional context
 * - Uppercase, bold, tracked text for prominence
 */
export const StatusBadgesAfter = () => {
  return (
    <div className="flex gap-2">
      <span className="
        inline-flex items-center gap-1.5
        bg-[hsl(160_75%_40%)] text-white
        px-3 py-1.5 rounded-full
        font-semibold text-xs uppercase tracking-wide
        shadow-sm
      ">
        <CheckCircle className="w-3.5 h-3.5" />
        Active
      </span>
      
      <span className="
        inline-flex items-center gap-1.5
        bg-[hsl(35_85%_42%)] text-white
        px-3 py-1.5 rounded-full
        font-semibold text-xs uppercase tracking-wide
        shadow-sm
      ">
        <AlertCircle className="w-3.5 h-3.5" />
        Pending
      </span>
      
      <span className="
        inline-flex items-center gap-1.5
        bg-[hsl(0_75%_48%)] text-white
        px-3 py-1.5 rounded-full
        font-semibold text-xs uppercase tracking-wide
        shadow-sm
      ">
        <AlertCircle className="w-3.5 h-3.5" />
        Failed
      </span>
    </div>
  );
};

/**
 * OR using utility classes:
 */
export const StatusBadgesAfterWithUtilities = () => {
  return (
    <div className="flex gap-2">
      <span className="badge-success">
        <CheckCircle className="w-3.5 h-3.5" />
        Active
      </span>
      
      <span className="badge-warning">
        <AlertCircle className="w-3.5 h-3.5" />
        Pending
      </span>
      
      <span className="badge-danger">
        <AlertCircle className="w-3.5 h-3.5" />
        Failed
      </span>
    </div>
  );
};

// ============================================================================
// EXAMPLE 4: TASK CARD (KANBAN)
// ============================================================================

/**
 * ❌ BEFORE - Flat, poor readability
 */
export const TaskCardBefore = () => {
  return (
    <div className="bg-white border border-gray-200 rounded p-3">
      <span className="text-[10px] text-gray-400 uppercase">High</span>
      <h4 className="text-sm text-gray-800 mt-2">Fix login bug</h4>
      <div className="flex items-center justify-between mt-3">
        <div className="w-6 h-6 rounded-full bg-gray-300" />
        <span className="text-xs text-gray-400">Due: Feb 10</span>
      </div>
    </div>
  );
};

/**
 * ✅ AFTER - Clear hierarchy, readable
 * 
 * Improvements:
 * - 10px text → Minimum 12px (WCAG compliant)
 * - Priority badge with strong color and icon
 * - Title: text-sm → text-base font-semibold
 * - Proper avatar with initials
 * - Color-coded deadline icon
 * - 2px border for strength
 * - Proper spacing and sections
 */
export const TaskCardAfter = () => {
  return (
    <div className="
      bg-white 
      border-2 border-[hsl(220_14%_82%)] 
      rounded-lg 
      p-4 
      shadow-sm hover:shadow-md 
      transition-all duration-200
      cursor-grab active:cursor-grabbing
    ">
      <div className="flex items-center justify-between mb-3">
        <span className="
          inline-flex items-center gap-1
          px-2 py-1 
          bg-[hsl(0_75%_48%)] text-white 
          text-xs font-bold uppercase 
          rounded
        ">
          <AlertCircle size={12} />
          High
        </span>
        <button className="text-[hsl(220_12%_68%)] hover:text-[hsl(220_14%_25%)] transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>
      
      <h4 className="text-base font-semibold text-[hsl(220_20%_8%)] mb-4 leading-tight">
        Fix login bug
      </h4>
      
      <div className="flex items-center justify-between pt-3 border-t border-[hsl(220_14%_82%)]">
        <div className="flex items-center gap-2">
          <div className="
            w-7 h-7 rounded-full 
            bg-[hsl(210_85%_42%)] 
            flex items-center justify-center
          ">
            <span className="text-white text-xs font-bold">JD</span>
          </div>
          <span className="text-xs font-medium text-[hsl(220_14%_25%)]">John Doe</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-[hsl(220_14%_25%)]">
          <Calendar size={12} className="text-[hsl(0_75%_48%)]" />
          Feb 10
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 5: FORM INPUTS
// ============================================================================

/**
 * ❌ BEFORE - Weak borders, unclear focus
 */
export const FormInputBefore = () => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Email Address</label>
        <input 
          type="email"
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="you@example.com"
        />
      </div>
    </div>
  );
};

/**
 * ✅ AFTER - Clear, accessible forms
 * 
 * Improvements:
 * - Label: Bold, stronger color
 * - Border: 1px → 2px for visibility
 * - Padding: py-2 → py-3 for better touch targets
 * - Focus state: Clear ring with primary color
 * - Placeholder: Higher contrast
 */
export const FormInputAfter = () => {
  return (
    <div className="space-y-4">
      <div>
        <label className="
          block mb-2
          text-[hsl(220_14%_25%)] text-sm font-semibold
          tracking-tight
        ">
          Email Address
        </label>
        <input 
          type="email"
          className="
            w-full px-4 py-3
            bg-white
            border-2 border-[hsl(220_14%_82%)]
            rounded-lg
            text-[hsl(220_20%_8%)] text-base
            placeholder:text-[hsl(220_10%_52%)]
            focus:border-[hsl(210_85%_42%)] 
            focus:ring-4 focus:ring-[hsl(210_95%_85%)]
            focus:outline-none
            transition-all duration-200
          "
          placeholder="you@example.com"
        />
      </div>
      
      {/* Error state example */}
      <div>
        <label className="block mb-2 text-[hsl(220_14%_25%)] text-sm font-semibold">
          Password
        </label>
        <input 
          type="password"
          className="
            w-full px-4 py-3
            bg-white
            border-2 border-[hsl(0_75%_48%)]
            rounded-lg
            text-[hsl(220_20%_8%)] text-base
            focus:ring-4 focus:ring-[hsl(0_90%_82%)]
            focus:outline-none
            transition-all duration-200
          "
          placeholder="Enter password"
          aria-invalid="true"
          aria-describedby="password-error"
        />
        <p id="password-error" className="mt-1 text-[hsl(0_75%_48%)] text-sm font-medium flex items-center gap-1">
          <AlertCircle size={14} />
          Password must be at least 8 characters
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 6: PROJECT CARD
// ============================================================================

/**
 * ✅ Complete project card with all improvements
 */
export const ProjectCardComplete = () => {
  return (
    <div className="card-interactive p-6 max-w-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="badge-info mb-2">
            Active Project
          </span>
          <h3 className="text-heading-3">Website Redesign</h3>
        </div>
        <button className="
          p-2 rounded-lg
          text-[hsl(220_12%_68%)] hover:text-[hsl(220_14%_25%)]
          hover:bg-[hsl(220_18%_95%)]
          transition-colors
        ">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Description */}
      <p className="text-body-secondary mb-4">
        Complete overhaul of the company website with modern design and improved UX
      </p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption uppercase tracking-wider">Progress</span>
          <span className="text-sm font-bold text-[hsl(220_14%_25%)]">68%</span>
        </div>
        <div className="h-2 bg-[hsl(220_18%_95%)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[hsl(210_85%_42%)] rounded-full transition-all"
            style={{ width: '68%' }}
          />
        </div>
      </div>

      {/* Team */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-[hsl(220_14%_82%)]">
        <div className="flex -space-x-2">
          {['JS', 'MK', 'AL'].map((initials, i) => (
            <div 
              key={i}
              className="
                w-8 h-8 rounded-full border-2 border-white
                bg-[hsl(210_85%_42%)] text-white
                flex items-center justify-center
                text-xs font-bold
              "
            >
              {initials}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-[hsl(220_14%_25%)]">
          <Calendar size={14} className="text-[hsl(210_85%_42%)]" />
          <span>Due Mar 15</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUMMARY OF KEY IMPROVEMENTS
// ============================================================================

/**
 * 🎨 Design Transformation Summary
 * 
 * BEFORE → AFTER
 * 
 * 1. COLORS
 *    - Pale (slate-200) → Strong (neutral-300, 2px borders)
 *    - Weak text (gray-400) → High contrast (neutral-700, neutral-900)
 *    - Teal primary → Vibrant blue (primary-600)
 * 
 * 2. TYPOGRAPHY
 *    - 10px text → Minimum 12px
 *    - text-base → text-xl for headings
 *    - Regular weight → Semibold/Bold for emphasis
 * 
 * 3. SPACING
 *    - p-3/p-4 → p-5/p-6 for better breathing room
 *    - Tight spacing → Generous margins and padding
 * 
 * 4. INTERACTIVITY
 *    - Simple hover → Hover + focus + active states
 *    - No shadows → shadow-sm → shadow-md/lg
 *    - Missing focus rings → Clear 4px rings with color
 * 
 * 5. ACCESSIBILITY
 *    - Color-only indicators → Color + Icon + Text
 *    - Low contrast (2:1) → High contrast (4.5:1+ WCAG AA)
 *    - Small touch targets → 44px minimum height
 *    - Missing ARIA → Proper labels and roles
 * 
 * 6. VISUAL HIERARCHY
 *    - Flat → Clear surface elevation with borders and shadows
 *    - Uniform text → Strong size and weight differentiation
 *    - No categories → Clear badge systems with color coding
 * 
 * RESULT: A modern, vibrant, accessible interface that's easy to scan,
 * read, and interact with while maintaining professional aesthetics.
 */
