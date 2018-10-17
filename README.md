### Not implemented:
"# #> #s <# base convert decimal find forget hold sign context current 2over 2rot 2swap d- d0= d2/ dabs dmax dmin du< d.r 2constant 2variable"

### Other
Clojure code for finding not implementing words.

```clj
((fn not-implemented [s1 s2]
     (let [words1 (-> s1
		      (clojure.string/replace "Nucleus layer" "")
		      (clojure.string/replace "none" "")
		      (clojure.string/replace "LOAD" "")
		      (clojure.string/replace "CODE" "")
		      (clojure.string/replace "END-CODE" "")
		      (clojure.string/replace "Device layer" "")
		      (clojure.string/replace "Interpreter layer" "")
		      (clojure.string/replace "Compiler layer" "")
		      (clojure.string/split #"[ \t\n]+")
		      (->>
		       (remove clojure.string/blank?)
		       (map clojure.string/lower-case)))
		  words2 (-> s2
			     (clojure.string/replace "ok" "")
			     (clojure.string/split #"[ \t\n]+")
			     (->>
			      (remove clojure.string/blank?)
			      (map clojure.string/lower-case)
			      (map (fn [s] (apply str (butlast (drop 2 s))))))
			     (set))]
       (clojure.string/join " " (remove words2 words1))))
       "          Nucleus layer 
             	!  *  */  */MOD  +  +!  -  /  /MOD  0<  0=  0>  1+  1-  2+  
2-  2/  <  =  >  >R  ?DUP  @  ABS  AND  C!  C@  CMOVE  
CMOVE>  COUNT  D+  D<  DEPTH  DNEGATE  DROP  DUP  EXECUTE  
EXIT  FILL  I  J  MAX  MIN  MOD  NEGATE  NOT  OR  OVER  PICK  
R>  R@  ROLL  ROT  SWAP  U<  UM*  UM/MOD  XOR 
          Device layer 
             	BLOCK  BUFFER  CR  EMIT  EXPECT  FLUSH  KEY  SAVE-BUFFERS  
SPACE  SPACES  TYPE  UPDATE 
          Interpreter layer 
             	#  #>  #S  #TIB  '  (  -TRAILING  .  .(  <#  >BODY  >IN  
ABORT  BASE  BLK  CONVERT  DECIMAL  DEFINITIONS  FIND  
FORGET  FORTH  FORTH-83  HERE  HOLD  LOAD  PAD  QUIT  SIGN  
SPAN  TIB  U.  WORD 
          Compiler layer 
             	+LOOP  ,  .\"  :  ;  ABORT\"  ALLOT  BEGIN  COMPILE  CONSTANT  
CREATE  DO  DOES>  ELSE  IF  IMMEDIATE  LEAVE  LITERAL  LOOP  
REPEAT  STATE  THEN  UNTIL  VARIABLE  VOCABULARY  WHILE    
[']  [COMPILE]  ] 
          Nucleus layer 
             	BRANCH  ?BRANCH 
          Device layer 

               none


          Interpreter layer 
             	CONTEXT  CURRENT 
          Compiler layer 
             	<MARK  <RESOLVE  >MARK  >RESOLVE 

          Nucleus layer 

               none


          Device layer 

               none


          Interpreter layer 
             	ASSEMBLER 
          Compiler layer 
             	;CODE  CODE  END-CODE 

          Nucleus layer 
             	2!  2@  2DROP  2DUP  2OVER  2ROT  2SWAP  D+  D-  D0=  D2/  
D<  D=  DABS  DMAX  DMIN  DNEGATE  DU< 
          Device layer 

               none


          Interpreter layer 
             	D.  D.R 
          Compiler layer 
             	2CONSTANT  2VARIABLE 
" "")
```


Some utils

```forth
copy block: <from-block> <to-block> cp
clear block: <block> db
```