# asyncsearch

Denops Async Search plugin.

# Features 

This plugin is a wrapper for some grep tools.

[非同期に Grep 検索する (denops.vim)](https://zenn.dev/yukimemi/articles/2021-03-21-dps-asyngrep)

[![asciicast](https://asciinema.org/a/JFQPdITg4is48RwQLpcTLTIJv.svg)](https://asciinema.org/a/JFQPdITg4is48RwQLpcTLTIJv)

# Installation 

If you use [folke/lazy.nvim](https://github.com/folke/lazy.nvim).

```lua
{
  "yukimemi/asyncsearch.vim",
  lazy = false,
  dependencies = {
    "vim-denops/denops.vim",
  },
}
```

If you use [yukimemi/dvpm](https://github.com/yukimemi/dvpm).

```typescript
dvpm.add({ url: "yukimemi/asyncsearch.vim" });
```

# Requirements 

- [Deno - A modern runtime for JavaScript and TypeScript](https://deno.land/)
- [vim-denops/denops.vim: 🐜 An ecosystem of Vim/Neovim which allows developers to write cross-platform plugins in Deno](https://github.com/vim-denops/denops.vim)
- Some grep tools. rg, pt, jvgrep, ugrep etc.

# Usage 

No special settings are required.
Default is [config.toml](https://github.com/yukimemi/asyncsearch/blob/main/denops/asyncsearch/config.toml)

# Commands 

`:AsyncSearch`                                                                
Asyncronous grep.

# Config 

No settings are required. However, the following settings can be made if necessary.

`g:asyncsearch_debug`                        
Enable debug messages.
default is v:false

`g:asyncsearch_cfg_path`                                          
Path to config toml file path.
default is `~/.asyncsearch.toml`

# Example 

## Example vim settings.

```vim
" Debug log option.
let g:asyncsearch_debug = v:false
" User config (not necessary)
let g:asyncsearch_cfg_path = "~/.config/asyncsearch/config.toml"

" Search with default tool.
nnoremap <space>ss <cmd>AsyncSearch<cr>

" Search with ripgrep.
nnoremap <space>sr <cmd>AsyncSearch --tool=ripgrep<cr>
" Search with pt.
nnoremap <space>sp <cmd>AsyncSearch --tool=pt<cr>
" Search with jvgrep.
nnoremap <space>sj <cmd>AsyncSearch --tool=jvgrep<cr>
" Search with ugrep.
nnoremap <space>su <cmd>AsyncSearch --tool=ugrep<cr>
```

## Example toml config.

```ini
[[tool]]
name = "ripgrep-all"
cmd = "rg"
arg = ["-i", "--vimgrep", "--no-heading", "--hidden", "--no-ignore", "--regexp"]
# AsyncSearch --tool=ripgrep-all

[[tool]]
name = "jvgrep-all"
cmd = "jvgrep"
arg = ["-i", "--no-color", "-I", "-R", "-8"]
# AsyncSearch --tool=jvgrep-all

[[tool]]
name = "pt-all"
cmd = "pt"
arg = ["-i", "--nogroup", "--nocolor", "--smart-case", "--skip-vcs-ignores", "--hidden"]
# AsyncSearch --tool=pt-all

[[tool]]
name = "default"
cmd = "pt"
arg = ["-i", "--nogroup", "--nocolor"]
# AsyncSearch
```

# License 

Licensed under MIT License.

Copyright (c) 2024 yukimemi

