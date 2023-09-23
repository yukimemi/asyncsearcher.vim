# dps-asyngrep

Denops Async Grep plugin.

# Features 

This plugin is a wrapper for some grep tools.

[非同期に Grep 検索する (denops.vim)](https://zenn.dev/yukimemi/articles/2021-03-21-dps-asyngrep)

[![asciicast](https://asciinema.org/a/JFQPdITg4is48RwQLpcTLTIJv.svg)](https://asciinema.org/a/JFQPdITg4is48RwQLpcTLTIJv)

# Installation 

If you use [folke/lazy.nvim](https://github.com/folke/lazy.nvim).

```lua
{
  "yukimemi/dps-asyngrep",
  lazy = false,
  dependencies = {
    "vim-denops/denops.vim",
  },
}
```

If you use [yukimemi/dvpm](https://github.com/yukimemi/dvpm).

```typescript
dvpm.add({ url: "yukimemi/dps-asyngrep" });
```

# Requirements 

- [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)
- Some grep tools. rg, pt, jvgrep, ugrep etc.
# Usage 

No special settings are required.
Default is [config.toml](https://github.com/yukimemi/dps-asyngrep/blob/main/denops/asyngrep/config.toml)

# Commands 

`:Agp`                                                                
Asyncronous grep.

# Config 

No settings are required. However, the following settings can be made if necessary.

`g:asyngrep_debug`                        
Enable debug messages.
default is v:false

`g:asyngrep_cfg_path`                                          
Path to config toml file path.
default is `~/.asyngrep.toml`

# Example 

## Example vim settings.

```vim
" Debug log option.
let g:asyngrep_debug = v:false
" User config (not necessary)
let g:asyngrep_cfg_path = "~/.config/asyngrep/config.toml"

" Grep with default tool.
nnoremap <space>ss <cmd>Agp<cr>

" Grep with ripgrep.
nnoremap <space>sr <cmd>Agp --tool=ripgrep<cr>
" Grep with pt.
nnoremap <space>sp <cmd>Agp --tool=pt<cr>
" Grep with jvgrep.
nnoremap <space>sj <cmd>Agp --tool=jvgrep<cr>
" Grep with ugrep.
nnoremap <space>su <cmd>Agp --tool=ugrep<cr>
```

## Example toml config.

```ini
[[tool]]
name = "ripgrep-all"
cmd = "rg"
arg = ["-i", "--vimgrep", "--no-heading", "--hidden", "--no-ignore", "--regexp"]
# Agp --tool=ripgrep-all

[[tool]]
name = "jvgrep-all"
cmd = "jvgrep"
arg = ["-i", "--no-color", "-I", "-R", "-8"]
# Agp --tool=jvgrep-all

[[tool]]
name = "pt-all"
cmd = "pt"
arg = ["-i", "--nogroup", "--nocolor", "--smart-case", "--skip-vcs-ignores", "--hidden"]
# Agp --tool=pt-all

[[tool]]
name = "default"
cmd = "pt"
arg = ["-i", "--nogroup", "--nocolor"]
# Agp
```

# License 

Licensed under MIT License.

Copyright (c) 2023 yukimemi

