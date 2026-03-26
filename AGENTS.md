# Coast Runtime

This project runs inside a Coast (containerized host). Your file edits on the
host are instantly visible inside the container — the filesystem is shared. All
runtime commands (tests, builds, service restarts) must run inside the Coast.

## Discovery

Find the Coast instance for your current working directory:

```
coast lookup
```

This prints the instance name, ports, and example commands. Use the instance
name from the output for all subsequent commands.

## CLI Reference

```
coast lookup                              # find instance for cwd
coast ls                                  # list all instances
coast exec <inst> -- sh -c "cd <d> && <cmd>"  # run command inside Coast
coast ps <inst>                           # service status
coast logs <inst> --service <svc>         # read service logs
coast logs <inst> --service <svc> --tail 50
coast assign <inst> -w <worktree>         # switch instance to a worktree
coast run <name>                          # create a new instance
coast search-docs "query"                 # semantic search Coast docs
```

## Worktree Flow

When you start in a worktree, run `coast lookup`. If it finds an instance, use it.

If no instance is found, run `coast ls` and ask the user which option they want:

1. **Create a new Coast:** `coast run <name>` then `coast assign <name> -w <worktree>`
2. **Reassign an existing Coast:** `coast assign <existing> -w <worktree>`
3. **Skip Coast:** work without a runtime (edit files only, no tests/builds)

The `<worktree>` value is the branch name (`git branch --show-current`) or the
worktree identifier from `coast ls`. Always ask the user — never create or
reassign automatically.

## Rules

- Run `coast lookup` before your first runtime command in a session.
- Do not run services directly on the host. Use `coast exec` for everything.
- If `coast lookup` returns nothing, follow the worktree flow above.
