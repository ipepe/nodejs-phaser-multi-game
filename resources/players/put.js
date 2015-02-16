protect('name');
this.updateTime = Date.now();

if( Math.abs(previous.xCord - this.xCord) > 32 ){
    cancel('some cheating involved?');
}
if( Math.abs(previous.yCord - this.yCord) > 32 ){
    cancel('some cheating involved?');
}
//todo: check direction if up, down right or left, others are not permitted