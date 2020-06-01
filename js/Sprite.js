(function(){
    var Sprite=window.Sprite=function(row,col,imageName){
        this.row=row;
        this.col=col;
        this.imageName=imageName;  //图片名字 
        
        this.x=calcXYByRC(this.row,this.col)['x']; //自己的位置
        this.y=calcXYByRC(this.row,this.col)['y'];
        this.spriteWH=calcXYByRC(this.row,this.col)['spriteWH'];
        
        this.isMove=false;
        this.fNO=0;//当fNO等于duringFrames时，停止运动
        
        this.isBomb=false;
        this.bombStep=0;//0~7
        this.isHide=false;
    }

    Sprite.prototype.update=function(){
        if(this.isHide) return;

        if(this.isMove){
            this.x+=this.dx;
            this.y+=this.dy;

            this.fNO--;
        }
        if(this.fNO<=0){
            this.isMove=false;
        }
        if(this.isBomb){
            game.frameNO%5==0&&this.bombStep++;//frameNO%5放慢爆炸动画

            if(this.bombStep>7){
                this.isHide=true;
            }

            
        }
    }

    Sprite.prototype.render=function(){
        //如果这个精灵在隐藏，什么都不渲染
        if(this.isHide) return;
        if(!this.isBomb){
            game.ctx.drawImage(game.R[this.imageName],this.x+5,this.y+5,this.spriteWH-10,this.spriteWH-10);//这里i和j哪个先都可以
        }else{
            game.ctx.drawImage(game.R['bomb'],200*this.bombStep,0,200,200,this.x,this.y,this.spriteWH,this.spriteWH);//这里i和j哪个先都可以
        }         
    }
    //运动
    Sprite.prototype.moveTo=function(targetR,targetC,duringFrames){
        this.isMove=true;

        var targetX=calcXYByRC(targetR,targetC).x;
        var targetY=calcXYByRC(targetR,targetC).y;

        var distanceX=targetX-this.x;
        var distanceY=targetY-this.y;

        this.dx=distanceX/duringFrames;
        this.dy=distanceY/duringFrames;

        this.fNO=duringFrames;
    }

    // 爆炸函数
    Sprite.prototype.bomb=function(){
        this.isBomb=true;
    }

    //辅助函数，通过行号和列号来计算x、y和图片的宽度（高度）
    function calcXYByRC(row,col){
        
        return{
            'x':game.baseX+game.spriteWH*col,
            'y':game.baseY+game.spriteWH*row,
            'spriteWH':game.spriteWH
        }
    }
})();