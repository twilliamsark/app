# Move the repo root to nutrition (one repo, no nested warning)

You currently have:
- **nutrition/.git** – outer repo (no remote)
- **app/.git** – inner repo (has origin, main/mobile, history)

Do this **from the workspace root** (`nutrition`). Run in Terminal.

## Steps

### 1. Remove the outer repo
```bash
cd /Users/todd/dev/angular/projects/nutrition
rm -rf .git
```

### 2. Move the inner repo up to nutrition
```bash
mv app/.git .
```

Now the repo root is `nutrition`, and the same history/remotes/branches from `app` are preserved.

### 3. Fix the working tree and commit
Paths in the existing index were relative to `app/`, so Git will show a lot of “deleted” and “untracked” until you re-add from the new root:

```bash
git add app/
git add .cursor/
git add .gitignore
# add any other top-level files you want tracked, e.g.:
# git add README.md
git status
git commit -m "chore: move repo root to nutrition (include app, .cursor)"
```

### 4. Optional: set remote again
The moved `.git` already has `origin` from app. If you want the remote to reflect the new root (e.g. a repo named `nutrition`), change the URL:

```bash
git remote set-url origin https://github.com/YOUR_USER/nutrition.git
```

Then push as usual (you may need to force-push if you rewrote history, or push a new branch).

---

**Note:** Old commits still have paths relative to the old `app/` root. Checking out an old commit would put files under `nutrition/src/` instead of `nutrition/app/src/`. For day-to-day work this is fine; to rewrite full history so every path is under `app/`, you’d use something like `git filter-repo` (advanced).
