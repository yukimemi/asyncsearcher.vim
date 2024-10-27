" =============================================================================
" File        : asyncsearcher.vim
" Author      : yukimemi
" Last Change : 2024/10/27 16:57:45.
" =============================================================================

function! asyncsearcher#denops_notify(method, params) abort
  call denops#plugin#wait_async("asyncsearcher", function("denops#notify", ["asyncsearcher", a:method, a:params]))
endfunction

function! asyncsearcher#search(...) abort
  call asyncsearcher#denops_notify("asyncsearch", a:000)
endfunction

