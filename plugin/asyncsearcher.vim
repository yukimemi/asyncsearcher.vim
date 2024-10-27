" =============================================================================
" File        : asyncsearcher.vim
" Author      : yukimemi
" Last Change : 2024/10/27 16:56:30.
" =============================================================================

if exists('g:loaded_asyncsearcher')
  finish
endif
let g:loaded_asyncsearcher = 1

command! -nargs=* AsyncSearch call asyncsearcher#search(<f-args>)

