(function(){
    var Map=window.Map=function(col,row,type){
        //存储一个数字（精灵类型）的标志性的地图状态，不是真精灵
       this.code=[
           [_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
           [_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
           [_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
           [_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
           [_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
           [_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
           [_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6),_.random(0,6)],
           []//补一行以防锁定列，指针j下移有个去处
       ];

       //七乘七矩阵，存放真实精灵
       this.sprites=[[],[],[],[],[],[],[]];
       // 应该下落多少行
       this.needDrop=[[],[],[],[],[],[],[]];

       //实例化地图时，就要从15个演员中选7个
       var sArr=['i0','i1','i2','i3','i4','i5','i6','i7','i8','i9','i10','i11','i12','i13','i14'];
       //随机7个图
       this.imageNameArr=_.sample(sArr,7);
    //    console.log(this.imageNameArr);
       
       this.create();
    }
    //根据code矩阵创建sprites数组
    Map.prototype.create=function(){
        for(var i=0;i<7;i++){
            for(var j=0;j<7;j++){
                this.sprites[i][j]=new Sprite(i,j,this.imageNameArr[this.code[i][j]]);
            }
        }
    }

    Map.prototype.render=function(){
        for(var i=0;i<7;i++){
            for(var j=0;j<7;j++){
                this.sprites[i][j].update();
                this.sprites[i][j].render();
            }
        }
    }
    //检查能否消除，返回一个消除的位置数组
    Map.prototype.check=function(){
        var arr=this.code;

        var result1=[];
        for(row=0;row<7;row++){
            var i=0;//指针1
            var j=1;//指针2

            while(i<7){
                if(arr[row][i]!=arr[row][j]){
                    if(j-i>=3){
                        for(var m=i;m<=j-1;m++){
                            result1.push({"row":row,"col":m});
                        }
                    }
                    i=j;
                }
                j++;
            }
        }
    
        var result2=[];
        for(col=0;col<7;col++){
            var i=0;
            var j=1;

            while(i<7){
                if(arr[i][col]!=arr[j][col]){
                    if(j-i>=3){
                        for(var m=i;m<=j-1;m++){
                            var isExist=false;
                            _.each(result1,function(item){//在result2出现前遍历result3，去除重合的（交叉的）
                                if(item.row==m&&item.col==col){
                                    isExist=true;
                                }
                            });
                            !isExist&&result2.push({"row":m,"col":col});
                        }
                    }
                    i=j;
                }
                j++;
            }
        }
    
        var allresult=result1.concat(result2);
        return allresult;
    }

    //消除
    Map.prototype.eliminate=function(callback){

        //验证是不是达到连消--combo，间隔500帧（定时器20ms，10s）算
        if(game.frameNO-game.lastEliFrame<=250){
            game.combo++;
        }else{
            game.combo=1;
        }

        var eNO=game.combo<8?"e"+game.combo:"e8";
        //播放声音   
        game.Music[eNO].load();//连消再加载一遍
        game.Music[eNO].play();
        //存帧数
        game.lastEliFrame=game.frameNO;
        //加分
        game.score+=2*game.combo;
        var self=this;
        _.each(this.check(),function(item){
            self.sprites[item.row][item.col].bomb();

            self.code[item.row][item.col]="";
        });

        game.regcallback(35,callback);//35耦合高
    }
    //下落方法
    Map.prototype.dropdown=function(fra,callback){
        for(var row=0;row<6;row++){
            for(var col=0;col<7;col++){
                if(this.code[row][col]===""){//0==""  true  所以坚持用0需要全等
                    this.needDrop[row][col]=0;
                }else{
                    var count=0;
                    for(var _row=row+1;_row<7;_row++){
                        if(this.code[_row][col]===""){//0==""  true  所以坚持用0需要全等
                            count++;
                        }
                    }
                    this.needDrop[row][col]=count;
                }
            }
        }

        for(var row=0;row<6;row++){
            for(var col=0;col<7;col++){
                this.sprites[row][col].moveTo(row+ this.needDrop[row][col],col,fra);
            }
        }

        game.regcallback(fra,callback)
    }

    //补齐
    Map.prototype.supply=function(fra,callback){
        
        var supplyNO=[0,0,0,0,0,0,0,0];
        for(var col=0;col<7;col++){
            for(var row=0;row<7;row++){
                if(this.code[row][col]===""){
                    supplyNO[col]++;
                    this.code[row][col]=_.random(0,6);
                }
            }
        }
        //补足code矩阵
        this.create();
        //需要补足的元素先移动到某个位置再下落
        for(var i=0;i<7;i++){//i列 j行
            for(var j=0;j<supplyNO[i];j++){
                this.sprites[j][i].y=10;
                this.sprites[j][i].moveTo(j,i,fra);
            }
        }

        game.regcallback(fra,callback)
    }

    //交换元素
    Map.prototype.exchange=function(startRow,startCol,targetRow,targetCol){
        console.log(startRow,startCol,"-->",targetRow,targetCol)
        this.sprites[startRow][startCol].moveTo(targetRow,targetCol,6);
        this.sprites[targetRow][targetCol].moveTo(startRow,startCol,6);

        //改变fsm为“动画状态”，防止fsm为“A”时多次拖动
        game.fsm="动画中";

        var self=this;

        game.regcallback(6,function(){
            var temp=self.code[startRow][startCol];
            self.code[startRow][startCol]=self.code[targetRow][targetCol];
            self.code[targetRow][targetCol]=temp;

            if(self.check().length==0){
                console.log('消除不了')
                self.sprites[startRow][startCol].moveTo(startRow,startCol,6);
                self.sprites[targetRow][targetCol].moveTo(targetRow,targetCol,6);

                var temp=self.code[startRow][startCol];
                self.code[startRow][startCol]=self.code[targetRow][targetCol];
                self.code[targetRow][targetCol]=temp;
                //6帧之后 还是A
                game.regcallback(6,function(){
                    game.fsm="A";
                })

            }else{
                //sprites物理矩阵交换位置
                var temp=self.sprites[startRow][startCol];
                self.sprites[startRow][startCol]=self.sprites[targetRow][targetCol];
                self.sprites[targetRow][targetCol]=temp;
                //改变状态机，竟然可以玩了
                game.fsm="C";
            }
        })
    }

    

})();

