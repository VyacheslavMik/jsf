\ words: block buffer update save-buffers flush use            
                                                               
code block          env.block();          end-code             
code buffer         env.block();          end-code             
code update         env.buffer_update();  end-code             
code save-buffers   env.save_buffers();   end-code             
code flush          env.flush();          end-code             
code use   let file = env.readWord(); env.use(file);   end-code
                                                               
2 load 3 load 4 load 5 load 6 load 7 load 8 load 9 load 10 load
11 load 12 load 13 load 14 load 15 load 16 load 17 load 18 load
19 load 20 load 21 load 22 load 23 load 24 load 25 load 26 load
27 load 28 load 29 load 30 load 31 load 32 load 33 load 34 load
35 load                                                        
                                                               
                                                               
\ words: exit >=                                               
                                                               
code exit                                                      
  env.returnStackPopCell();                                    
end-code                                                       
                                                               
code >=                                                        
  let a = env.dataStackPopNum();                               
                                                               
                                                               
  let b = env.dataStackPopNum();                               
  if (b >= a) { env.dataStackPushCell(-1); }                   
  else        { env.dataStackPushCell(0); }                    
end-code                                                       
                                                               
                                                               
\ words: @ !                                                   
code @                                                         
  let addr = env.dataStackPopCell();                           
  let val = env.readCell(env.memory, addr);                    
  env.dataStackPushCell(val);                                  
end-code                                                       
                                                               
code !                                                         
  let addr = env.dataStackPopCell();                           
  let val = env.dataStackPopCell();                            
  env.writeCell(env.memory, addr, val);                        
end-code                                                       
                                                               
                                                               
                                                               
                                                               
\ words: c@ c!                                                 
code c@                                                        
  let addr = env.dataStackPopCell();                           
  let val = env.readByte(env.memory, addr);                    
  env.dataStackPushCell(val);                                  
end-code                                                       
                                                               
code c!                                                        
  let addr = env.dataStackPopCell();                           
  let val = env.dataStackPopCell();                            
  env.writeByte(env.memory, addr, val);                        
end-code                                                       
                                                               
                                                               
                                                               
                                                               
\ words: . +                                                   
                                                               
code .                                                         
  let val = env.dataStackPopNum();                             
  env.printValue(val);                                         
end-code                                                       
                                                               
code +                                                         
  let a = env.dataStackPopCell();                              
  let b = env.dataStackPopCell();                              
  env.dataStackPushCell(a + b);                                
end-code                                                       
                                                               
                                                               
                                                               
                                                               
\ words: - *                                                   
                                                               
code -                                                         
  let a = env.dataStackPopCell();                              
  let b = env.dataStackPopCell();                              
  env.dataStackPushCell(b - a);                                
end-code                                                       
                                                               
code *                                                         
  let a = env.dataStackPopCell();                              
  let b = env.dataStackPopCell();                              
  env.dataStackPushCell(a * b);                                
end-code                                                       
                                                               
                                                               
                                                               
\ words: / u.                                                  
                                                               
code /                                                         
  let a = env.dataStackPopNum();                               
  let b = env.dataStackPopNum();                               
  env.dataStackPushCell(Math.floor(b / a));                    
end-code                                                       
                                                               
code u.                                                        
  let v = env.dataStackPopCell();                              
  env.printValue(v);                                           
end-code                                                       
                                                               
                                                               
                                                               
                                                               
\ words: >r r>                                                 
                                                               
code >r                                                        
  let next_word = env.returnStackPopCell();                    
  env.returnStackPushCell(env.dataStackPopCell());             
  env.returnStackPushCell(next_word);                          
end-code                                                       
                                                               
code r>                                                        
  let next_word = env.returnStackPopCell();                    
  env.dataStackPushCell(env.returnStackPopCell());             
  env.returnStackPushCell(next_word);                          
end-code                                                       
                                                               
                                                               
                                                               
\ words: r@ dup drop                                           
                                                               
code r@                                                        
  let top = env.returnStackPopCell();                          
  env.dataStackPushCell(env.returnStackPeekCell());            
  env.returnStackPushCell(top);                                
end-code                                                       
                                                               
code dup                                                       
  env.dataStackPushCell(env.dataStackPeekCell());              
end-code                                                       
                                                               
code drop                                                      
  env.dataStackPopCell();                                      
end-code                                                       
                                                               
\ words: swap =                                                
                                                               
code swap                                                      
  let a = env.dataStackPopCell();                              
  let b = env.dataStackPopCell();                              
  env.dataStackPushCell(a);                                    
  env.dataStackPushCell(b);                                    
end-code                                                       
                                                               
code =                                                         
  let a = env.dataStackPopCell();                              
  let b = env.dataStackPopCell();                              
  if (a == b) { env.dataStackPushCell(-1); }                   
  else { env.dataStackPushCell(0); }                           
end-code                                                       
                                                               
\ words: : not                                                 
                                                               
code :                                                         
  let name = env.readWord();                                   
  if (name.trim() == '') throw 'Empty string for name';        
  env.printValue('c[' + name + ']');                           
  env.memory[0] = 1;                                           
  env.memory[2] = 1;                                           
  env.entry(name);                                             
end-code                                                       
                                                               
code not                                                       
  env.dataStackPushCell(~env.dataStackPopCell());              
end-code                                                       
                                                               
                                                               
\ words: immediate ;                                           
                                                               
code immediate                                                 
  w = env.vocabularies[0].word;                                
  env.memory[w] = 1;                                           
end-code                                                       
                                                               
code ;                                                         
  let word = env.code_pointer_addr(env.find_word('exit'));     
  env.memWriteNextCell(2);                                     
  env.memWriteNextCell(word);                                  
  env.memory[0] = 0; env.memory[2] = 0;                        
end-code immediate                                             
                                                               
                                                               
                                                               
\ words: , c, 0=                                               
                                                               
code ,                                                         
  let v = env.dataStackPopCell();                              
  env.memWriteNextCell(v);                                     
end-code                                                       
                                                               
code c,                                                        
  let v = env.dataStackPopCell();                              
  env.memWriteNextByte(v);                                     
end-code                                                       
                                                               
: 0=   0 =  ;                                                  
                                                               
                                                               
                                                               
\ words: here, does>                                           
                                                               
code here                                                      
   env.dataStackPushCell(env.dp);                              
end-code                                                       
                                                               
code does>                                                     
  code_pointer = env.returnStackPopCell();                     
  w = env.vocabularies[0].word;                                
  pf = env.code_pointer_addr(w);                               
  env.writeCell(env.memory, pf + 6, code_pointer);             
end-code                                                       
                                                               
: nop ;                                                        
                                                               
                                                               
\ words: create                                                
                                                               
code create                                                    
  let name = env.readWord();                                   
  env.printValue('n[' + name + ']');                           
  if (name.trim() == '') { throw 'Empty string for name'; }    
  nop_caddr = env.code_pointer_addr(env.find_word('nop'));     
  exit_caddr = env.code_pointer_addr(env.find_word('exit'));   
  env.entry(name);                                             
  env.memWriteNextCell(3);                                     
  env.memWriteNextCell(env.dp + 10);                           
  env.memWriteNextCell(2);                                     
  env.memWriteNextCell(nop_caddr);                             
  env.memWriteNextCell(2);                                     
  env.memWriteNextCell(exit_caddr);                            
end-code                                                       
\ words: variable constant ' execute                           
                                                               
: variable   create  0 ,  does>  ;                             
: constant   create  ,  does>  @  ;                            
                                                               
code '                                                         
  let word = env.readWord();                                   
  if (word.trim() == '') { throw 'Empty string for word'; }    
  let w = env.find_word(word);                                 
  if (w == undefined) throw 'Word is not found '  + word;      
  env.dataStackPushCell(env.code_pointer_addr(w));             
end-code                                                       
                                                               
: execute   >r  ;                                              
                                                               
                                                               
\ words: compile >mark >resolve ?branch branch                 
                                                               
: branch   r> 2 + @ >r ;                                       
: compile   2 ,  r>  dup 2 + @  ,  4 + >r  ;                   
: >mark   2 ,  here  0 ,  ;                                    
: >resolve   here swap !  ;                                    
                                                               
code ?branch                                                   
  f = env.dataStackPopCell();                                  
  let addr = env.returnStackPopCell();                         
  if (f == 0) { addr = env.readCell(env.memory, addr + 2); }   
  else { addr = addr + 4; }                                    
  env.returnStackPushCell(addr);                               
end-code                                                       
                                                               
                                                               
\ words: if then else <mark <resolve do +loop                  
                                                               
: if   compile ?branch >mark ; immediate                       
: then   >resolve  ; immediate                                 
: else   compile branch >mark swap >resolve ; immediate        
                                                               
: <mark   here  ;                                              
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
  let n3 = env.dataStackPopCell();                             
  let n2 = env.dataStackPopCell();                             
  let n1 = env.dataStackPopCell();                             
  env.dataStackPushCell(Math.floor((n1*n2)/n3));               
end-code                                                       
                                                               
                                                               
\ words: .s pick over +!                                       
                                                               
code .s                                                        
  env.printStack(env.ds);                                      
end-code                                                       
                                                               
code pick                                                      
  let a = env.dataStackPopCell();                              
  let b = env.readCell(env.ds.arr, env.ds.p - (a + 1) * 2);    
  env.dataStackPushCell(b);                                    
end-code                                                       
                                                               
: over   1 pick ;                                              
: +!   swap over @  + swap ! ;                                 
                                                               
                                                               
\ words: /mod <                                                
                                                               
code /mod                                                      
  let n2 = env.dataStackPopNum();                              
  let n1 = env.dataStackPopNum();                              
  let n4 = Math.floor(n1 / n2);                                
  env.dataStackPushCell(n1 - n2 * n4);                         
  env.dataStackPushCell(n4);                                   
end-code                                                       
                                                               
code <                                                         
  let n2 = env.dataStackPopNum();                              
  let n1 = env.dataStackPopNum();                              
  if (n1 < n2) { env.dataStackPushCell(-1); }                  
  else         { env.dataStackPushCell(0); }                   
end-code                                                       
\ words: > 0< 0> 1+ 1- 2+ 2- 2/                                
                                                               
code >                                                         
  let n2 = env.dataStackPopNum();                              
  let n1 = env.dataStackPopNum();                              
  if (n1 > n2) { env.dataStackPushCell(-1); }                  
  else         { env.dataStackPushCell(0); }                   
end-code                                                       
                                                               
: 0<   0 <  ;                                                  
: 0>   0 >  ;                                                  
: 1+   1 +  ;                                                  
: 1-   1 -  ;                                                  
: 2+   2 +  ;                                                  
: 2-   2 -  ;                                                  
: 2/   2 /  ;                                                  
\ words: ?dup abs and or                                       
                                                               
: ?dup   dup 0= not  if dup then  ;                            
: abs   dup 0< if -1 * then ;                                  
                                                               
code and                                                       
  let a = env.dataStackPopCell();                              
  let b = env.dataStackPopCell();                              
  env.dataStackPushCell(a & b);                                
end-code                                                       
                                                               
code or                                                        
  let a = env.dataStackPopCell();                              
  let b = env.dataStackPopCell();                              
  env.dataStackPushCell(a | b);                                
end-code                                                       
\ words: cmove cmove> count depth fill max                     
                                                               
: cmove   dup 0= if drop drop drop else                        
   0 do over i + c@  over i + c!  loop drop drop then ;        
: cmove>   dup 0= if drop drop drop else                       
   -1 swap do  over i + c@  over i + c!  -1 +loop drop drop    
   then ;                                                      
: count   1+ dup 1- c@ ;                                       
                                                               
code depth                                                     
  env.dataStackPushCell(env.ds.p / 2);                         
end-code                                                       
                                                               
: fill  over if swap 0 do over i + over swap c! loop           
   else drop then  drop drop ;                                 
: max   over over < if swap then drop ;                        
\ words: min mod negate roll rot                               
                                                               
: min   over over > if swap then drop ;                        
: mod   /mod drop ;                                            
: negate   0 swap - ;                                          
                                                               
code roll                                                      
  let n = env.dataStackPopCell() + 1;                          
  let v = env.readCell(env.ds.arr, env.ds.p - 2 * n);          
  let idx = env.ds.p - env.ds.arr.length - 2 * n;              
  env.ds.arr.splice(idx, 2);                                   
  env.ds.p -= 2;                                               
  env.dataStackPushCell(v);                                    
end-code                                                       
                                                               
: rot   2 roll ;                                               
\ words: u< um*                                                
                                                               
code u<                                                        
  let u2 = env.dataStackPopCell();                             
  let u1 = env.dataStackPopCell();                             
  if (u1 < u2) { env.dataStackPushCell(-1); }                  
  else         { env.dataStackPushCell(0); }                   
end-code                                                       
                                                               
code um*                                                       
  let u2 = env.dataStackPopCell();                             
  let u1 = env.dataStackPopCell();                             
  env.dataStackPushDCell(u1 * u2);                             
end-code                                                       
                                                               
                                                               
\ word: d. um/mod                                              
                                                               
code d.  env.printValue(env.dataStackPopDCellNum());  end-code 
                                                               
code ud.  env.printValue(env.dataStackPopDCell());  end-code   
                                                               
code um/mod                                                    
  let u1 = env.dataStackPopCell();                             
  let ud = env.dataStackPopDCell();                            
  let u3 = Math.floor(ud / u1);                                
  env.dataStackPushCell(ud - u1 * u3);                         
  env.dataStackPushCell(u3);                                   
end-code                                                       
                                                               
                                                               
                                                               
\ words: xor emit cr space spaces                              
                                                               
code xor                                                       
  let w2 = env.dataStackPopCell();                             
  let w1 = env.dataStackPopCell();                             
  env.dataStackPushCell(w1 ^ w2);                              
end-code                                                       
                                                               
code emit                                                      
  let c = env.dataStackPopCell();                              
  env.printChar(c);                                            
end-code                                                       
                                                               
: cr   10 emit ;                                               
: space  32 emit ;                                             
: spaces   dup if 0 do space loop else drop then ;             
\ words: key type allot begin until 2! 2@ 2drop d= 2dup        
                                                               
code key                                                       
  env.waitKey();                                               
end-code                                                       
                                                               
: type   dup if  0 do  dup i + c@ emit  loop  else  drop  then 
   drop ;                                                      
: allot   0 do 0 c, loop ;                                     
: begin   <mark  ; immediate                                   
: until   compile not compile ?branch <resolve ; immediate     
: 2!   dup >r  ! r> 2 + ! ;                                    
: 2@   dup 2 + @  swap @  ;                                    
: 2drop  drop drop  ;                                          
: d=   rot = >r = r> and  ;                                    
: 2dup   over over  ;                                          
\ words: leave expect list #tib                                
                                                               
: inc-var   1 over +! @ ;                                      
variable (+loop)-xt  ' (+loop) (+loop)-xt !                    
variable (leave-i)                                             
: leave   (+loop)-xt @ 2  r@ (leave-i) !                       
   begin  2dup (leave-i) inc-var 2@  d= not  until             
   2drop (leave-i) @ 12 + r> r> r> 2drop drop  >r  ;           
variable span                                                  
: expect   0 span !  dup 0= if drop drop else                  
   0 do  key  dup 13 = if  space leave  else                   
   dup emit  over i + c!  1 span +!  then  loop  drop  then ;  
: list   block  16 0 do cr i .  dup i 64 * +  64 type  loop ;  
code #tib                                                      
   env.dataStackPushCell(env.number_tib_pos);                  
end-code                                                       
\ words: >in >body rs-clear ds-clear quit abort blk pad tib    
\       forth-83                                               
code >in   env.dataStackPushCell(env.to_in_pos); end-code      
: >body  ; : forth-83  ;                                       
code rs-clear   env.rs.p = 0;  end-code                        
code ds-clear   env.ds.p = 0;  end-code                        
: quit   0 #tib !  0 >in !  0 0 !  rs-clear  ;                 
: abort   ds-clear  quit  ;                                    
code blk  env.dataStackPushCell(env.block_number_pos); end-code
: pad   256 here +  ;                                          
code tib  env.dataStackPushCell(env.tib_pos);  end-code        
: input-stream   blk c@ dup  if block else drop tib then ;     
: input-limit   blk c@ dup if block 1024 else drop #tib @ tib  
   then +  ;                                                   
: input-next-char   input-stream >in @ 1 + +  dup              
   input-limit >= if drop 0 else 1 then  ;                     
\ words: word skip-char wait-char                              
                                                               
: skip-char    begin dup input-next-char  dup if               
   drop  c@ = 1 >in +! then  until  ;                          
: wait-char   begin dup input-next-char  dup if                
   drop  c@ = not  1 >in +! then  until  ;                     
: word   skip-char  >in @ swap  wait-char drop >in @           
   1 >in +!  over - dup  pad c!  swap input-stream + swap      
   pad 1 + swap  cmove>  pad ;                                 
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
                                                               
\ words: */mod                                                 
                                                               
code */mod                                                     
  let n3 = env.dataStackPopNum();                              
  let n2 = env.dataStackPopNum();                              
  let n1 = env.dataStackPopNum();                              
  n1 *= n2; n2 = n3;                                           
  let n4 = Math.floor(n1 / n2);                                
  env.dataStackPushCell(n1 - n2 * n4);                         
  env.dataStackPushCell(n4);                                   
end-code                                                       
code d+                                                        
  let wd2 = env.dataStackPopDCell();                           
  let wd1 = env.dataStackPopDCell();                           
 env.dataStackPushDCell(wd1 + wd2);                            
end-code                                                       
\ words: d< dnegate                                            
                                                               
code d<                                                        
  let d2 = env.dataStackPopDCellNum();                         
  let d1 = env.dataStackPopDCellNum();                         
  env.dataStackPushCell(d1 < d2 ? -1 : 0);                     
end-code                                                       
                                                               
code dnegate                                                   
  let d = env.dataStackPopDCellNum();                          
  env.dataStackPushDCell(-d);                                  
end-code                                                       
                                                               
: .(   41 word count type  ; immediate                         
: (   41 word drop  ; immediate                                
                                                               
\ words: s" space? -trailing state [ ] [compile] ['] (.") ."   
                                                               
: s"   34 word count ;                                         
: space?  ( addr -- flag)  c@ 32 =  ;                          
: -trailing   dup 0= not if dup 0 do  over over + 1 -          
   space?  if  1 -  else  leave  then  loop  then  ;           
: state  0  ;                                                  
: [  0 state c!  ;  immediate                                  
: ]  1 state c!  ;                                             
: [compile]  2 , ' , ; immediate                               
: [']  ' [compile] literal  ; immediate                        
: (.")  r> count  2dup + >r  type ;                            
: ."   compile (.") 34 word count  dup c,  here swap           
   dup allot cmove> ; immediate                                
: while   compile ?branch  >mark  ; immediate                  
: repeat  swap <resolve >resolve  ; immediate                  
