#!/bin/bash
# resumable: usage render_all.sh OUTDIR [scenes...]; skips frames that already exist
cd /home/user/Mult/film3d
OUT=$1; shift
SC=${@:-"s1 s2 s3 s4 s5 s6"}
for s in $SC; do
  start=$(date +%s)
  for k in 0 1 2 3; do node render2.js $s.json $OUT/$s $k 4 1920 60 > $OUT/$s.log$k 2>&1 & done
  wait
  echo "$s done in $(($(date +%s)-start))s" >> $OUT/progress.txt
done
echo ALLDONE >> $OUT/progress.txt
