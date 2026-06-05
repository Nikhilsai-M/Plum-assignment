# Submission Checklist

- ✅ Build succeeds
- ✅ Tests pass
- ✅ Documentation updated
- ✅ No secrets committed
- ✅ Runtime assets preserved
- ✅ Deployment instructions verified
- ✅ GitHub-ready

## Verification Commands

```bash
npm test
npm run build
```

## Submission Notes

- Runtime JSON assets live in `data/`.
- Supabase schema is available at `supabase/schema.sql`.
- Environment placeholders are documented in `.env.example`.
- Real local credentials must remain outside Git and should be rotated if they were exposed elsewhere.
