# Submission path budget

The complete added submission is limited to 8,388,608 bytes. Target allocation:

| Paths | Maximum budget |
| --- | ---: |
| `src/`, root HTML, package files, configuration, `scripts/` | 650,000 bytes |
| `public/` local artwork, font, avatars and share image | 2,000,000 bytes |
| `dist/` complete production export | 3,000,000 bytes |
| Documentation, licenses and `.gitignore` | 500,000 bytes |
| Reserve | 2,238,608 bytes |

Explicit ignore-file budget: `.gitignore` may use up to **1,000 bytes** to exclude generated dependency/cache directories at every depth, TypeScript build information, and the disposable `test/scratch/` area. It must not exclude `dist/`, source, required runtime assets, manifests or lockfiles. The final actual byte count is recorded in `docs/VALIDATION.md`.

Dependencies and browser downloads used by this worker are installed outside the repository. They are not deliverables. No vendored registry or submodule is needed.
