# Design Guidelines - Bezerra Representações Management System

## Design Approach: Design System-Based

**Selected System**: Material Design adapted for business administration
**Rationale**: Material Design provides robust patterns for data-heavy applications with clear hierarchy, excellent form design, and proven interaction models for CRUD operations.

## Typography System

**Font Family**: Inter (via Google Fonts CDN)
- **Headings**: 
  - H1 (Page titles): font-semibold, text-3xl
  - H2 (Section headers): font-semibold, text-2xl
  - H3 (Card/Component headers): font-medium, text-lg
- **Body Text**: font-normal, text-base
- **Labels**: font-medium, text-sm
- **Data/Numbers**: font-medium, tabular-nums for alignment
- **Meta/Secondary**: font-normal, text-sm with reduced opacity

## Layout & Spacing System

**Tailwind Spacing Units**: Consistent use of 4, 6, 8, 12, 16 units
- Component padding: p-4 (cards), p-6 (sections), p-8 (main containers)
- Vertical rhythm: space-y-6 for related groups, space-y-8 for sections
- Grid gaps: gap-4 (tight), gap-6 (standard), gap-8 (spacious)

**Container Strategy**:
- Sidebar navigation: Fixed width w-64
- Main content: flex-1 with max-w-7xl mx-auto px-6
- Cards/Panels: Full width within containers with consistent p-6

## Core Components

### Navigation
- **Sidebar**: Fixed left sidebar with company branding at top
  - Logo area: h-16 with p-4
  - Navigation items: p-3 with rounded-lg, font-medium
  - Icons from Heroicons (outline style)
  - Active state: distinct background treatment
  - Sections: Dashboard, Clientes, Pedidos, Entregas, Produtos, Relatórios

### Dashboard Layout
- **Header Bar**: h-16 with page title, breadcrumbs, and user menu
- **Stats Cards Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
  - Each card: p-6, rounded-lg with shadow-sm
  - Icon + Label + Large Number format
  - Metrics: Pedidos Pendentes, Entregas Hoje, Clientes Ativos, Valor Mensal
- **Activity Sections**: 2-column layout (lg:grid-cols-2) for Recent Orders + Upcoming Deliveries

### Forms Design
- **Input Groups**: space-y-1 (label above input)
- **Labels**: text-sm font-medium mb-1
- **Inputs**: p-3, rounded-lg, border, full width
- **Multi-column Forms**: grid-cols-1 md:grid-cols-2 gap-6
- **Required Fields**: Asterisk in label
- **Action Buttons**: Bottom right alignment with Cancel (ghost) + Primary button

### Data Tables
- **Structure**: Responsive with horizontal scroll on mobile
- **Header Row**: font-semibold, text-sm, border-b-2
- **Data Rows**: p-4 vertical padding, border-b, hover state
- **Columns**: Adequate spacing (px-4), right-align for numbers
- **Actions Column**: Fixed right with icon buttons
- **Pagination**: Bottom center with page numbers + previous/next

### Cards & Panels
- **Standard Card**: rounded-lg, shadow-sm, p-6
- **Header Section**: flex justify-between items-center mb-4
- **Content Area**: space-y-4 for multiple items
- **Footer Actions**: border-t, pt-4, flex justify-end gap-3

### Modals & Dialogs
- **Overlay**: Fixed, backdrop blur
- **Dialog**: max-w-2xl, rounded-lg, shadow-xl
- **Header**: p-6, border-b with title and close button
- **Body**: p-6, max-h-96 overflow-y-auto
- **Footer**: p-6, border-t, flex justify-end gap-3

## Specific Features Implementation

### Client Registration
- Full-width form with 2-column grid layout
- Sections: Dados Básicos, Endereço, Informações Fiscais
- Expandable additional fields

### Order Management
- Table view with filters (Date range, Client, Status)
- Quick action buttons for View, Edit, Add Invoice
- Product selection with quantity inputs
- Total calculation display

### Delivery Scheduling
- Calendar integration or date/time picker
- Status badges (Pendente, Em Rota, Entregue)
- Address autocomplete field
- Driver assignment dropdown

### Invoice Registration
- Simple form: NF Number, Series, Emission Date
- Linked to specific order
- Display in order details view

## Responsive Behavior
- **Desktop (lg+)**: Full sidebar + multi-column layouts
- **Tablet (md)**: Collapsed sidebar (icon only) + 2-column max
- **Mobile**: Hidden sidebar (hamburger menu) + single column stacking

## Interaction Patterns
- **Loading States**: Skeleton screens for tables, spinner for actions
- **Success/Error**: Toast notifications top-right
- **Confirmation Dialogs**: For destructive actions
- **Empty States**: Helpful illustrations + CTA to create first item
- **Search**: Debounced input with magnifying glass icon

## Icons
**Library**: Heroicons (outline style via CDN)
- Navigation icons, action buttons, status indicators
- Consistent 20x20 or 24x24 sizing