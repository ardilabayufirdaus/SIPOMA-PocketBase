1. Modal component tidak memiliki prop className, perlu diubah untuk menggunakan div dengan class parameter-reorder-modal di dalamnya:

```tsx
{
  /* Parameter Reorder Modal */
}
<Modal
  isOpen={showReorderModal}
  onClose={() => setShowReorderModal(false)}
  title="Reorder Parameters"
>
  <div className="space-y-4 parameter-reorder-modal">...</div>
</Modal>;
```

2. Perlu menghapus duplikasi handleParameterDragEnd dan memastikan hanya satu definisi yang digunakan.
