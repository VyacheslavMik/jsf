\ words: block buffer update save-buffers flush use            
                                                               
code block          env.block();          end-code             
code buffer         env.block();          end-code             
code update         env.bufferUpdate();   end-code             
code save-buffers   env.saveBuffers();    end-code             
code flush          env.flush();          end-code             
code use   let file = env.readWord(); env.use(file);   end-code
                                                               
2 load 3 load 4 load 5 load 6 load 7 load 8 load 9 load 10 load
11 load 12 load 13 load 14 load 15 load 16 load 17 load 18 load
19 load 20 load 21 load 22 load 23 load 24 load 25 load 26 load
27 load 28 load 29 load 30 load 31 load 32 load 33 load 34 load
35 load 36 load 37 load 38 load 39 load 40 load 41 load 42 load
43 load                                                        
                                                               
\ words: exit >=                                               
                                                               
code exit  env.rsPop();  end-code                              
                                                               
code >=                                                        
  let a = env.dsPop('n');                                      
  let b = env.dsPop('n');                                      
  env.dsPush(b >= a, 'b');                                     
end-code                                                       
                                                               
code @                                                         
  let addr = env.dsPop();                                      
  let val = env.readCell(env.memory, addr);                    
  env.dsPush(val);                                             
end-code                                                       
                                                               
\ words: @ !                                                   
                                                               
code !                                                         
  let addr = env.dsPop();                                      
  let val = env.dsPop();                                       
  env.writeCell(env.memory, addr, val);                        
end-code                                                       
                                                               
code c@                                                        
  let addr = env.dsPop();                                      
  let val = env.readByte(env.memory, addr);                    
  env.dsPush(val);                                             
end-code                                                       
                                                               
code dup   env.dsPush(env.dsPeek());  end-code                 
code drop  env.dsPop();               end-code                 
\ words: c@ c!                                                 
                                                               
code c!                                                        
  let addr = env.dsPop();                                      
  let val = env.dsPop();                                       
  env.writeByte(env.memory, addr, val);                        
end-code                                                       
                                                               
code +                                                         
  let a = env.dsPop();                                         
  let b = env.dsPop();                                         
  env.dsPush(a + b);                                           
end-code                                                       
                                                               
code not   env.dsPush(~env.dsPop());  end-code                 
code here  env.dsPush(env.dp);        end-code                 
\ words: - *                                                   
                                                               
code -                                                         
  let a = env.dsPop();                                         
  let b = env.dsPop();                                         
  env.dsPush(b - a);                                           
end-code                                                       
                                                               
code *                                                         
  let a = env.dsPop();                                         
  let b = env.dsPop();                                         
  env.dsPush(a * b);                                           
end-code                                                       
                                                               
code ,   env.memWriteNextCell(env.dsPop());  end-code          
code c,  env.memWriteNextByte(env.dsPop());  end-code          
\ words: /                                                     
                                                               
code /                                                         
  let a = env.dsPop('n');                                      
  let b = env.dsPop('n');                                      
  env.dsPush(Math.floor(b / a));                               
end-code                                                       
                                                               
code >r                                                        
  let nextWord = env.rsPop();                                  
  env.rsPush(env.dsPop());                                     
  env.rsPush(nextWord);                                        
end-code                                                       
                                                               
code .s     env.printStack(env.ds);    end-code                
code depth  env.dsPush(env.ds.p / 2);  end-code                
\ words: >r r>                                                 
                                                               
code r>                                                        
  let nextWord = env.rsPop();                                  
  env.dsPush(env.rsPop());                                     
  env.rsPush(nextWord);                                        
end-code                                                       
                                                               
code r@                                                        
  let top = env.rsPop();                                       
  env.dsPush(env.rsPeek());                                    
  env.rsPush(top);                                             
end-code                                                       
                                                               
code and  env.dsPush(env.dsPop() & env.dsPop());  end-code     
code or   env.dsPush(env.dsPop() | env.dsPop());  end-code     
\ words: swap =                                                
                                                               
code swap                                                      
  let a = env.dsPop();                                         
  let b = env.dsPop();                                         
  env.dsPush(a);                                               
  env.dsPush(b);                                               
end-code                                                       
                                                               
code =                                                         
  let a = env.dsPop();                                         
  let b = env.dsPop();                                         
  env.dsPush(a == b, 'b');                                     
end-code                                                       
                                                               
code um*  env.dsPush(env.dsPop() * env.dsPop(), 'd');  end-code
\ words: : not                                                 
                                                               
code :                                                         
  let name = env.readWord();                                   
  if (name.trim() == '') throw 'Empty string for name';        
  env.memory[0] = 1;                                           
  env.memory[2] = 1;                                           
  env.entry(name);                                             
end-code                                                       
                                                               
code immediate                                                 
  let w = env.compilationVocabulary.word;                      
  env.memory[w] = 1;                                           
end-code                                                       
                                                               
code emit  env.printChar(env.dsPop());  end-code               
\ words: immediate ;                                           
                                                               
code ;                                                         
  let exitXt = env.toBody(env.findWord('exit'));               
  env.memWriteNextCell(2);                                     
  env.memWriteNextCell(exitXt);                                
  env.memory[0] = 0; env.memory[2] = 0;                        
end-code immediate                                             
                                                               
code does>                                                     
  let w = env.compilationVocabulary.word;                      
  let pf = env.toBody(w);                                      
  env.writeCell(env.memory, pf + 6, env.rsPop());              
end-code                                                       
                                                               
: 0=   0 =  ;                                                  
\ words: here, does>                                           
                                                               
: nop ;                                                        
                                                               
code create                                                    
  let name = env.readWord();                                   
  if (name.trim() == '') { throw 'Empty string for name'; }    
  let nopAddr = env.findWord('nop');                           
  let nopXt = env.toBody(nopAddr);                             
  let exitAddr = env.findWord('exit');                         
  let exitXt = env.toBody(exitAddr);                           
  env.entry(name);                                             
  env.memWriteNextCell(3); env.memWriteNextCell(env.dp + 10);  
  env.memWriteNextCell(2); env.memWriteNextCell(nopXt);        
  env.memWriteNextCell(2); env.memWriteNextCell(exitXt);       
end-code                                                       
\ words: variable constant ' execute                           
                                                               
: variable   create  0 ,  does>     ;                          
: constant   create    ,  does>  @  ;                          
                                                               
code '                                                         
  let word = env.readWord();                                   
  if (word.trim() == '') { throw 'Empty string for word'; }    
  let w = env.findWord(word);                                  
  if (w == undefined) throw 'Word is not found '  + word;      
  env.dsPush(env.toBody(w));                                   
end-code                                                       
                                                               
: execute   >r  ;                                              
                                                               
code key  env.waitKey();  end-code                             
\ words: compile >mark >resolve ?branch branch                 
                                                               
: branch     r> 2 + @ >r                    ;                  
: compile    2 ,  r>  dup 2 + @  ,  4 + >r  ;                  
: >mark      2 ,  here  0 ,                 ;                  
: >resolve   here swap !                    ;                  
                                                               
code ?branch                                                   
  let f = env.dsPop();                                         
  let addr = env.rsPop();                                      
  if (f == 0) { addr = env.readCell(env.memory, addr + 2); }   
  else { addr = addr + 4; }                                    
  env.rsPush(addr);                                            
end-code                                                       
                                                               
code #tib  env.dsPush(env.numberTibPos);  end-code             
\ words: if then else <mark <resolve do +loop                  
                                                               
: if     compile ?branch >mark              ; immediate        
: then   >resolve                           ; immediate        
: else   compile branch >mark swap >resolve ; immediate        
                                                               
: <mark     here    ;                                          
: <resolve  2 ,  ,  ;                                          
                                                               
: do   compile >r  compile >r  <mark  ; immediate              
                                                               
variable (do)-w1  variable (do)-w2                             
: (+loop)   r> swap  r> (do)-w1 !  dup r> + (do)-w2 !          
   (do)-w1 @ (do)-w2 @  - swap /  0=  dup not                  
   if (do)-w2 @ >r  (do)-w1 @ >r then swap >r ;                
: +loop   compile (+loop) compile ?branch <resolve  ; immediate
\ words: literal loop i j */                                   
                                                               
: literal   3 ,  ,  ; immediate                                
: loop   3 ,  1 , compile (+loop) compile ?branch              
    <resolve  ; immediate                                      
: i   r> r> r> dup >r swap >r swap >r ;                        
: j   r> r> r> r> r> dup >r swap >r swap >r swap >r swap >r ;  
                                                               
code */                                                        
  let n3 = env.dsPop();                                        
  let n2 = env.dsPop();                                        
  let n1 = env.dsPop();                                        
  env.dsPush(Math.floor((n1*n2)/n3));                          
end-code                                                       
                                                               
code >in   env.dsPush(env.toInPos); end-code                   
\ words: .s pick over +!                                       
                                                               
code pick                                                      
  let a = env.dsPop();                                         
  let b = env.readCell(env.ds.arr, env.ds.p - (a + 1) * 2);    
  env.dsPush(b);                                               
end-code                                                       
                                                               
: over   1 pick                 ;                              
: +!     swap over @  + swap !  ;                              
                                                               
code <                                                         
  let n2 = env.dsPop('n');                                     
  let n1 = env.dsPop('n');                                     
  env.dsPush(n1 < n2, 'b');                                    
end-code                                                       
\ words: /mod <                                                
                                                               
code /mod                                                      
  let n2 = env.dsPop('n');                                     
  let n1 = env.dsPop('n');                                     
  let n4 = Math.floor(n1 / n2);                                
  env.dsPush(n1 - n2 * n4);                                    
  env.dsPush(n4);                                              
end-code                                                       
                                                               
code >                                                         
  let n2 = env.dsPop('n');                                     
  let n1 = env.dsPop('n');                                     
  env.dsPush(n1 > n2, 'b');                                    
end-code                                                       
                                                               
\ words: > 0< 0> 1+ 1- 2+ 2- 2/                                
                                                               
: 0<   0 <  ;                                                  
: 0>   0 >  ;                                                  
: 1+   1 +  ;                                                  
: 1-   1 -  ;                                                  
: 2+   2 +  ;                                                  
: 2-   2 -  ;                                                  
: 2/   2 /  ;                                                  
                                                               
: ?dup   dup 0= not  if dup then  ;                            
: abs    dup 0< if -1 * then      ;                            
                                                               
: count   1+ dup 1- c@                   ;                     
: max     over over < if swap then drop  ;                     
                                                               
\ words: cmove cmove> count depth fill max                     
                                                               
: cmove   dup 0= if drop drop drop else                        
   0 do over i + c@  over i + c!  loop drop drop then ;        
                                                               
: cmove>   dup 0= if drop drop drop else                       
   -1 swap 1- do  over i + c@  over i + c!  -1 +loop           
   drop drop then ;                                            
                                                               
: fill  over if swap 0 do over i + over swap c! loop           
   else drop then  drop drop ;                                 
                                                               
: min      over over > if swap then drop ;                     
: mod      /mod drop                     ;                     
: negate   0 swap -                      ;                     
                                                               
\ words: min mod negate roll rot                               
                                                               
code roll                                                      
  let n = env.dsPop() + 1;                                     
  let v = env.readCell(env.ds.arr, env.ds.p - 2 * n);          
  let idx = env.ds.p - env.ds.arr.length - 2 * n;              
  env.ds.arr.splice(idx, 2);                                   
  env.ds.p -= 2;                                               
  env.dsPush(v);                                               
end-code                                                       
                                                               
: rot      2 roll                                ;             
: cr       10 emit                               ;             
: space    32 emit                               ;             
: spaces   dup if 0 do space loop else drop then ;             
                                                               
\ words: u< um*                                                
                                                               
code u<                                                        
  let u2 = env.dsPop();                                        
  let u1 = env.dsPop();                                        
  env.dsPush(u1 < u2, 'b');                                    
end-code                                                       
                                                               
code um/mod                                                    
  let u1 = env.dsPop();                                        
  let ud = env.dsPop('ud');                                    
  let u3 = Math.floor(ud / u1);                                
  env.dsPush(ud - u1 * u3);                                    
  env.dsPush(u3);                                              
end-code                                                       
                                                               
\ words: xor emit cr space spaces                              
                                                               
code xor                                                       
  let w2 = env.dsPop();                                        
  let w1 = env.dsPop();                                        
  env.dsPush(w1 ^ w2);                                         
end-code                                                       
                                                               
: allot   0 do 0 c, loop                       ;               
: begin   <mark                                ; immediate     
: until   compile not compile ?branch <resolve ; immediate     
: 2!      dup >r  ! r> 2 + !                   ;               
: 2@      dup 2 + @  swap @                    ;               
: 2drop   drop drop                            ;               
: d=      rot = >r = r> and                    ;               
: 2dup    over over                            ;               
\ words: key type allot begin until 2! 2@ 2drop d= 2dup        
                                                               
: type   dup if  0 do  dup i + c@ emit  loop  else  drop  then 
   drop ;                                                      
: inc-var   1 over +! @ ;                                      
variable (+loop)-xt  ' (+loop) (+loop)-xt !                    
variable (leave-i)                                             
variable span                                                  
                                                               
: leave   (+loop)-xt @ 2  r@ (leave-i) !                       
   begin  2dup (leave-i) inc-var 2@  d= not  until             
   2drop (leave-i) @ 12 + r> r> r> 2drop drop  >r  ;           
                                                               
: expect   0 span !  dup 0= if drop drop else                  
   0 do  key  dup 13 = if  space leave  else                   
   dup emit  over i + c!  1 span +!  then  loop  drop  then ;  
\ words: >in >body rs-clear ds-clear quit abort blk pad tib    
\       forth-83                                               
code blk        env.dsPush(env.blockNumberPos); end-code       
code tib        env.dsPush(env.tibPos);         end-code       
code rs-clear   env.rs.p = 0;                   end-code       
code ds-clear   env.ds.p = 0;                   end-code       
                                                               
: >body  ; : forth-83  ;                                       
: quit           0 #tib !  0 >in !  0 0 !  rs-clear      ;     
: abort          ds-clear  quit                          ;     
: pad            256 here +                              ;     
: input-stream   blk c@ dup  if block else drop tib then ;     
: input-limit   blk c@ dup if block 1024 else drop #tib @ tib  
   then +  ;                                                   
: input-next-char   input-stream >in @ 1 + +  dup              
   input-limit >= if drop 0 else -1 then  ;                    
\ words: word skip-char wait-char                              
                                                               
: skip-char   begin dup input-next-char  if  c@ = 1 >in +!     
   else 2drop 0 exit then  until  ;                            
: wait-char   begin dup input-next-char  if c@ = not  1 >in +! 
   else 2drop 1 >in +!  0 exit then  until  1 >in +!  ;        
: word   skip-char  >in @ swap  dup if wait-char then  if >in @
   1 - else >in @ then over - dup  pad c!  swap input-stream + 
   swap  pad 1 + swap  cmove>  pad ;                           
                                                               
code d+                                                        
  let wd2 = env.dsPop('ud');                                   
  let wd1 = env.dsPop('ud');                                   
 env.dsPush(wd1 + wd2, 'd');                                   
end-code                                                       
                                                               
\ words: */mod                                                 
                                                               
code */mod                                                     
  let n3 = env.dsPop('n');                                     
  let n2 = env.dsPop('n');                                     
  let n1 = env.dsPop('n');                                     
  n1 *= n2; n2 = n3;                                           
  let n4 = Math.floor(n1 / n2);                                
  env.dsPush(n1 - n2 * n4);                                    
  env.dsPush(n4);                                              
end-code                                                       
                                                               
code vocab                                                     
  let s = env.memReadString(env.dsPop());                      
  env.vocabulary(s);                                           
end-code                                                       
\ words: d< dnegate                                            
                                                               
code d<                                                        
  let d2 = env.dsPop('d');                                     
  let d1 = env.dsPop('d');                                     
  env.dsPush(d1 < d2, 'b');                                    
end-code                                                       
                                                               
code dnegate  env.dsPush(-env.dsPop('d'), 'd');  end-code      
                                                               
: .(   41 word count type  ; immediate                         
:  (   41 word drop        ; immediate                         
                                                               
: state    0             ;                                     
: space?   c@ 32 =       ;                                     
: s"       34 word count ;                                     
\ words: s" space? -trailing state [ ] [compile] ['] (.") ."   
                                                               
: -trailing   dup 0= not if dup 0 do  over over + 1 -          
   space?  if  1 -  else  leave  then  loop  then  ;           
                                                               
: [          0 state c!           ;  immediate                 
: ]          1 state c!           ;                            
: [compile]  2 , ' ,              ; immediate                  
: [']        ' [compile] literal  ; immediate                  
                                                               
: (.")  r> count  2dup + >r  type ;                            
: ."   compile (.") 34 word count  dup c,  here swap           
   dup allot cmove> ; immediate                                
                                                               
: while   compile ?branch  >mark  ; immediate                  
: repeat  swap <resolve >resolve  ; immediate                  
\ words: vocab vocabulary vocabulary-name vocabulary-name!     
\        definitions assembler forth                           
                                                               
                                                               
                                                               
                                                               
                                                               
: vocabulary-name  32 word count dup >in @ swap - 1 - >in !  ; 
: vocabulary-name!  dup ,  here swap  dup allot  cmove>  ;     
: vocabulary  vocabulary-name  create  vocabulary-name!        
   does>  vocab  ;                                             
code definitions  env.definitions()  end-code                  
vocabulary forth                                               
s" assembler" dup dup dup pad + 1+ ! pad + 3 + swap cmove>     
pad count + vocab definitions vocabulary assembler             
                                                               
\ words: abort" (abort") find forget 2variable 2constant d0=   
\ 2swap 2over 2rot                                             
forth definitions                                              
code throw  env.throwError(); end-code                         
                                                               
: (abort")  if r> dup >r throw else r> count + >r then ;       
: abort"  compile (abort") 34 word count  dup c,  here swap    
   dup allot cmove> ; immediate                                
code find  env.find();  end-code                               
code forget  env.forget();  end-code                           
: 2variable  create 0 , 0 ,  ;                                 
: 2constant  create , ,  does>  2@  ;                          
: d0=  0= swap 0= and  ;                                       
: 2swap  3 roll 3 roll  ;                                      
: 2over  3 pick 3 pick  ;                                      
: 2rot  5 roll 5 roll  ;                                       
\ words: dabs dmax dmin d2/                                    
                                                               
code dabs                                                      
  let d = env.dsPop('d');                                      
  if (d < 0) { d = -d; }                                       
  env.dsPush(d, 'd');                                          
end-code                                                       
                                                               
: dmax  2over 2over d<  if  2swap  then  2drop  ;              
: dmin  2over 2over d< not if  2swap  then  2drop  ;           
                                                               
code d2/                                                       
  let d = env.dsPop('d');                                      
  env.dsPush(d / 2, 'd');                                      
end-code                                                       
                                                               
\ words: du< d- base decimal                                   
                                                               
code du<                                                       
  let ud2 = env.dsPop('ud');                                   
  let ud1 = env.dsPop('ud');                                   
  env.dsPush(ud1 < ud2, 'b');                                  
end-code                                                       
                                                               
code d-                                                        
  let ud2 = env.dsPop('ud');                                   
  let ud1 = env.dsPop('ud');                                   
  env.dsPush(ud1 - ud2, 'd');                                  
end-code                                                       
                                                               
variable base  : decimal  10 base !  ;  decimal                
                                                               
\ words: char [char] d* char-digit" input-char                 
                                                               
: input-char   input-stream >in @ +  dup input-limit >=        
   if drop 0 else -1 then  ;                                   
: char  >in @ 1 + input-limit >= if 0 else 1 >in +! input-char 
   if c@ 1 >in +! else 0 then then ;                           
: [char]  char [compile] literal  ; immediate                  
: char-digit"  here 128 0 do 128 c, loop [char] " word count 0 
   do dup i + c@  2 pick + i swap c! loop drop ;               
char-digit" 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno
qrstuvwxyz:;<=>?@[]^"                                          
code d*                                                        
  let wd2 = env.dsPop('d');                                    
  let wd1 = env.dsPop('d');                                    
  env.dsPush(wd1 * wd2, 'd');                                  
end-code                                                       
\ words: digit? accumulate convert d/mod                       
                                                               
: digit?  literal + c@ dup 128 = if drop 0 0 else dup base @   
   < if -1 else drop 0 0 then then ;                           
: accumulate  swap >r >r base @ 0 d* r> 0 d+ r>  ;             
: convert  1+ begin  dup c@ digit? if accumulate 1+ -1 else    
   drop 0 then until ;                                         
                                                               
\ ( d1 n1 -- n2 d2 )                                           
code d/mod                                                     
  let n1 = env.dsPop('n');                                     
  let d1 = env.dsPop('ud');                                    
  let d2 = Math.floor(d1 / n1);                                
  env.dsPush(d1 - n1 * d2);                                    
  env.dsPush(d2, 'd');                                         
end-code                                                       
\ words: digit-char" digit? <#addr#> <# #> # hold #s sign tuck 
                                                               
: digit-char"  here [char] " word count 0 do dup i + c@ c, loop
   drop ;                                                      
digit-char" 0123456789ABCDEF"                                  
: digit?  literal  swap dup base @ 1- > if 2drop 0 0 else + c@ 
   -1 then ;                                                   
variable <#addr#>                                              
: <#  pad 24 +  <#addr#> !  ;                                  
: #>  2drop  <#addr#> @ 1+  pad 24 + <#addr#> @ -  ;           
: #  base @ d/mod rot digit? if <#addr#> @ c! -1 <#addr#> +!   
   else abort" Something go wrong" then  ;                     
: hold  <#addr#> @ c! -1 <#addr#> +!  ;                        
: #s  begin # 2dup d0= not until  ;                            
: sign  0 < if [char] - hold then  ;                           
: tuck  dup rot rot  ;                                         
\ words: d. ud. u. . list d.r                                  
                                                               
: d.  tuck dabs <# #s rot sign #> type space  ;                
: ud. <# #s #> type space  ;                                   
: u.  0 ud.  ;                                                 
: .  dup 0 < if -1 else 0 then d.  ;                           
: list   block  16 0 do cr i .  dup i 64 * +  64 type  loop ;  
: d.r  >r tuck dabs <# #s rot sign #>  dup r> swap - dup 0 < if
   abort" Not enough space" else spaces type space then  ;     
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               

                                                              
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
