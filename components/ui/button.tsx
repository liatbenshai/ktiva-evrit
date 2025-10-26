# צרי את התיקייה
mkdir -p components/ui

# צרי את הקבצים
touch components/ui/button.tsx
touch components/ui/card.tsx
touch components/ui/dialog.tsx
touch components/ui/badge.tsx

# ערכי את הקבצים והעלי לגיטהאב
git add .
git commit -m "Add missing UI components"
git push
