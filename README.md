### Not implemented:
d+ d< dnegate # #> #s ( -trailing .( <# base convert decimal definitions find forget forth hold load sign .\" abort\" repeat state vocabulary while ['] [compile] ]

### Other
Clojure code for finding not implementing words.

```clj
((fn not-implemented [s1 s2]
     (let [words1 (-> s1
		      (clojure.string/replace "Nucleus layer" "")
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
       (clojure.string/join " " (remove words2 words1)))) "" "")
```


Some utils

```forth
copy block: <from-block> <to-block> cp
clear block: <block> db
```