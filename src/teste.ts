// definir x 
const a:number = 5;
const b:number = 8;
const x = (a:number,b:number) => a+b;
console.log(x);
const y = (...args: number[]) => args.reduce(x, 0);
console.log(y);