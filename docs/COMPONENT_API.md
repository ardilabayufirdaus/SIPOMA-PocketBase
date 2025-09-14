# Komponen API & Usage

## Atoms

### Button

- **Props:**
  - `variant`: "primary" | "secondary" | "success" | "warning" | "error" | "outline" | "ghost"
  - `size`: "xs" | "sm" | "base" | "lg" | "xl"
  - `loading`: boolean
  - `disabled`: boolean
  - `fullWidth`: boolean
  - `leftIcon`: ReactNode
  - `rightIcon`: ReactNode
  - `children`: ReactNode
  - `className`: string
- **Usage:**

```tsx
<Button variant="primary" size="lg">
  Submit
</Button>
```

### Badge

- **Props:**
  - `children`: ReactNode
  - `className`: string
- **Usage:**

```tsx
<Badge>Active</Badge>
```

## Molecules

### CollapsibleMenu

- **Props:**
  - `icon`: ReactNode
  - `label`: string
  - `isActive`: boolean
  - `pages`: { key: string; icon: ReactNode }[]
  - `activeSubPage`: string
  - `onSelect`: (pageKey: string) => void
  - `t`: any
  - `isCollapsed`: boolean
- **Usage:**

```tsx
<CollapsibleMenu
  icon={<Icon />}
  label="Menu"
  isActive={true}
  pages={[{ key: "page1", icon: <Page1Icon /> }]}
  activeSubPage="page1"
  onSelect={handleSelect}
  t={translations}
/>
```

---

## Guideline Pengembangan

- Gunakan atomic design: atoms, molecules, organisms, templates.
- Selalu tambahkan prop `className` untuk custom styling.
- Pastikan semua props terdokumentasi dan mudah digunakan.
- Tambahkan unit test untuk setiap komponen.
- Ikuti style guide dan design tokens untuk konsistensi UI.
