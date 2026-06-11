# Todoアプリ 実装方針

## 機能一覧

- [ ] Todo 一覧表示
- [ ] Todo 追加
- [ ] Todo 完了 / 未完了トグル
- [ ] Todo 削除
- [ ] AsyncStorage によるデータ永続化

---

## 技術スタック

| 技術 | 用途 |
|------|------|
| Expo SDK 54 / React Native | UIフレームワーク |
| TypeScript | 型安全性 |
| React Hooks | 状態管理 |
| AsyncStorage | ローカル永続化 |

---

## ディレクトリ構成

```
app/
├── types/
│   └── todo.ts          # Todo 型定義
├── hooks/
│   └── useTodos.ts      # CRUD ロジック + AsyncStorage
├── components/
│   ├── AddTodoForm.tsx  # Todo 入力フォーム
│   ├── TodoItem.tsx     # Todo 1件の表示
│   └── TodoList.tsx     # Todo 一覧
└── App.tsx              # 画面組み立て
```

---

## データモデル

```typescript
// types/todo.ts
type Todo = {
  id: string;        // ユニークID（uuid）
  text: string;      // Todo テキスト
  completed: boolean; // 完了フラグ
  createdAt: number; // 作成日時（timestamp）
};
```

---

## コンポーネント設計

### App.tsx
- `useTodos` フックから状態・操作を受け取る
- `AddTodoForm`・`TodoList` を配置する画面のルート

### AddTodoForm
- テキスト入力 + 追加ボタン
- Props: `onAdd: (text: string) => void`

### TodoList
- Todo 配列を受け取り `TodoItem` を並べる
- Props: `todos: Todo[]`, `onToggle`, `onDelete`

### TodoItem
- 1件の Todo を表示
- 完了時は取り消し線
- Props: `todo: Todo`, `onToggle`, `onDelete`

---

## useTodos フック

```typescript
// 返す値と操作
const {
  todos,       // Todo[]
  addTodo,     // (text: string) => void
  toggleTodo,  // (id: string) => void
  deleteTodo,  // (id: string) => void
} = useTodos();
```

- 初回マウント時に AsyncStorage からデータを読み込む
- 変更のたびに AsyncStorage に保存する

---

## 実装ステップ

1. AsyncStorage パッケージインストール
   ```bash
   docker compose run --rm app yarn add @react-native-async-storage/async-storage
   ```

2. `types/todo.ts` を作成（型定義）

3. `hooks/useTodos.ts` を作成（CRUD + 永続化）

4. `components/TodoItem.tsx` を作成

5. `components/TodoList.tsx` を作成

6. `components/AddTodoForm.tsx` を作成

7. `App.tsx` を更新して各コンポーネントを組み合わせる

8. Expo Go で動作確認

---

## スタイル方針

- `StyleSheet.create` のみ使用（外部ライブラリなし）
- シンプルなフラットデザイン
