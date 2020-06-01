(function(){
    var Game=window.Game=function(params){
        this.canvas=document.querySelector(params.id);
        this.ctx=this.canvas.getContext('2d');

        //资源文件地址
        this.Rjsonurl=params.Rjsonurl;
        //帧编号
        this.frameNO=0;
        //设置画布的宽度和高度
        this.init();


        //定基本位置
        this.baseX=6;//最左元素的左padding
        this.baseBottom=70;//最下行距离下面的padding-bottom
        this.spriteWH=(this.canvas.width-2*this.baseX)/7;
        this.baseY=this.canvas.height-this.spriteWH*7-this.baseBottom;

        //combo数值
        this.combo=1;
        this.lastEliFrame=0;// 最后一次消除的帧编号
        //回调函数数组
        this.callbacks={};

        //剩余时间，单位秒
        this.timing=10;

        //分数
        this.score=0;

        //事件锁
        this.lock=true;

        //读取资源
        var self=this;
        this.loadAllResource(function(){
            self.start();

            self.bindEvent();// 绑定监听
        });

    }
    //初始化，设置画布的宽度和高度
    Game.prototype.init=function() {
        //读取是扣的宽度和高度
        var windowW=document.documentElement.clientWidth;
        var windowH=document.documentElement.clientHeight;
        //验收
        if(windowW>414){
            windowW=414;
        }else if(windowW<320){
            windowW=320;
        }
        if(windowH>736){
            windowH=736;
        }else if(windowH<500){
            windowH=500;
        }
        //让canvas匹配视口
        this.canvas.width=windowW;
        this.canvas.height=windowH;
    }

    //读取资源
    Game.prototype.loadAllResource=function(callback){//callback  回调函数形参
        //准备一个R对象
        this.R={};
        this.Music={};
        var self=this;//备份
        var alreadyDoneNumber=0;//计数器
        //发出请求，请求JSON文件
        var xhr=new XMLHttpRequest();
        xhr.onreadystatechange=function(){
            if(xhr.readyState==4){//少写个=  排bug半天
                var Robj=JSON.parse(xhr.responseText);//转换为可读取的json
                // console.log(typeof Robj)
                for(var i=0;i<Robj.images.length;i++){
                    self.R[Robj.images[i].name]=new Image();//创建同名的k
                    self.R[Robj.images[i].name].src=Robj.images[i].url;//发出http请求
                    self.R[Robj.images[i].name].onload=function(){
                        alreadyDoneNumber++;
                        self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);
                        var txt='loading '+parseInt(alreadyDoneNumber/Robj.images.length)*100+'%'+', please wait';
                        self.ctx.textAlign='center';
                        self.ctx.font = "20px 微软雅黑";
                        self.ctx.fillText(txt,self.canvas.width/2,self.canvas.height*(1-0.618));//fillText后面没有=   排错又半天
                        if(alreadyDoneNumber==Robj.images.length){
                            // callback.call(self);
                            callback();
                        }
                    }
                };

                for(var i=0;i<Robj.musics.length;i++){
                    self.Music[Robj.musics[i].name]=document.createElement('audio');
                    self.Music[Robj.musics[i].name].src=Robj.musics[i].url;//发出http请求
                }
            }
        }
        xhr.open('get',this.Rjsonurl,true);
        xhr.send(null);
    }

    //开始游戏
    Game.prototype.start=function(){
        var self=this;

        this.fsm="B";//A静稳 B检查 C消除下落补充新的

        this.map=new Map();
        //播放音乐
        this.Music["bgm"].loop=true;//背景音乐不间断播放
        this.Music["bgm"].play();
        //开始游戏时的帧编号
        this.startFrame=this.frameNO;


        this.timer=setInterval(function(){
            self.frameNO++;

            self.ctx.clearRect(0,0,self.canvas.width,self.canvas.height);

            //背景不运动不再是一个类，可以直接画上去
            self.ctx.drawImage(self.R["bg1"],0,0,self.canvas.width,self.canvas.height);

            //logo
            self.ctx.drawImage(self.R["logo"],self.canvas.width/2-531/4,0,531/2,391/2);

            //渲染一个半透明的盒子   不知道为啥一开始无法渲染上去
            self.ctx.fillStyle="rgba(0,0,0,.5)";
            self.ctx.fillRect(self.baseX,self.baseY,self.spriteWH*7,self.spriteWH*7);


            //检查当前帧编号是不是回调函数中的帧编号
            if(self.callbacks.hasOwnProperty(self.frameNO.toString())){
                self.callbacks[self.frameNO.toString()]();//执行回调函数
                //当k的v的事件做完后，删除这个kv
                delete self.callbacks[self.frameNO.toString()];
            }

            //游戏结束，什么都不做
            if(self.isGameover){
                self.fsm="gameover";
                //渲染最终分数
                self.ctx.font="30px 宋体";
                self.ctx.textAlign="center";
                self.ctx.fillStyle="blue";
                self.ctx.fillText('your score is '+self.score,self.canvas.width/2,self.canvas.height/2);
                self.ctx.fillStyle="orange";
                self.ctx.fillText('your score is '+self.score,self.canvas.width/2+1,self.canvas.height/2+1);
                return;
            }

            // 渲染地图，包括精灵的更新和渲染
            self.map.render();

             //已经流逝的帧
            self.duringFrame=self.frameNO-self.startFrame; 
            //剩余的帧数
            self.restFrame=self.timing*50-self.duringFrame;
            //渲染倒计时条
            self.ctx.fillStyle="#333"
            self.ctx.fillRect(6,self.canvas.height-50,self.canvas.width-12,30);
            self.ctx.fillStyle="gold"
            self.ctx.fillRect(6,self.canvas.height-50,(self.canvas.width-12)*(self.restFrame/(self.timing*50)),30);
            //判断时间是否足够
            if(self.restFrame<0){
                self.gameover();
            }


            //根据状态机，来决定做什么事情
            switch(self.fsm){
                case "A":
                    break;
                case "B":
                    if(self.map.check().length!=0){
                        self.fsm="C";
                    }else{
                        self.fsm="A";
                    }
                    break;
                /*case "C":
                        self.map.eliminate();
                        self.fsm="D";  
                    break;
                case "D":
                    self.regcallback(35,function(){
                        self.map.dropdown();
                    })
                    self.fsm="E";
                    break;
                case "E":
                    self.regcallback(55,function(){
                        self.map.supply();
                        self.fsm="B";
                    })
                    break;*/


                /*case "C":
                    self.map.eliminate();
                    self.fsm="动画中";//防止动画积累
                    self.regcallback(35,function(){
                        self.map.dropdown();
                        self.fsm="动画中";
                        self.regcallback(20,function(){
                            self.map.supply();
                            self.fsm="动画中";
                            self.regcallback(20,function(){
                                self.fsm="B";
                            });
                        });
                    });
                    break;*/

                case "C":
                    
                    self.map.eliminate(function(){
                        self.map.dropdown(20,function(){//20是帧号
                            self.map.supply(20,function(){
                              self.fsm="B";
                            })
                        });
                    });
                    // console.log('naive')
                    self.fsm="动画中"//老师写的，firefox实测不写上面注释掉的会持续输出 "naive"
                    break;
            }

            //打印帧编号
            self.ctx.fillStyle='red';
            self.ctx.font='15px consolas';
            self.ctx.textalign='left';
            self.ctx.fillText('Frame:'+self.frameNO,50,20);
            self.ctx.fillText('FSM:'+self.fsm,50,50);  
            self.ctx.fillText('Combo:'+self.combo,50,80);  
            self.ctx.fillText('Rest:'+self.restFrame,50,110);  
            self.ctx.fillText('Score:'+self.score,50,140);  


        },20);
        
    }
    
        // 回调函数方法
    Game.prototype.regcallback=function(frameLater,fn){//frameLater传入不需要是字符串  obj[1]='an'
        this.callbacks[this.frameNO+frameLater]=fn;
    }

    Game.prototype.gameover=function(){
        this.isGameover=true;
    }

    Game.prototype.restart=function(){
        this.isGameover=false;
        this.timing=40;
        this.map=new Map();
        this.startFrame=this.frameNO;
        this.fsm="B";
        this.score=0;
        this.combo=0;
    }

    Game.prototype.bindEvent=function(){
        var self=this;
        this.canvas.addEventListener("touchstart",function(ev){
            if(self.fsm=="gameover"){//课后发现不玩就无法切换到gameover，无法点击开始下一局
                self.restart();
            }

            if(self.fsm!="A") return;


            var x=ev.touches[0].clientX;
            var y=ev.touches[0].clientY;

            self.startCol=parseInt(x/self.spriteWH);
            self.startRow=parseInt((y-self.baseY)/self.spriteWH);
            
            if(self.startCol<0||self.startCol>6||self.startRow<0||self.startRow>6){
                return;
            }  
        },true);

        this.canvas.addEventListener("touchmove",function(ev){
                touchmovehandler(ev);
            },true);

        this.canvas.addEventListener("touchend",function(){
            self.lock=true;
            self.canvas.removeEventListener("touchmove",touchmovehandler,true);
        },true);

        function touchmovehandler(ev){
            if(!self.lock) return;

            var x=ev.touches[0].clientX;
            var y=ev.touches[0].clientY;

            var startRow=self.startRow;
            var startCol=self.startCol;

            var targetCol=parseInt(x/self.spriteWH);
            var targetRow=parseInt((y-self.baseY)/self.spriteWH);

            if(targetCol<0||targetCol>6||targetRow<0||targetRow>6){
                self.canvas.removeEventListener("touchmove",touchmovehandler,true);
                return;
            }

            if(startCol==targetCol&&Math.abs(targetRow-startRow)==1
            ||startRow==targetRow&&Math.abs(targetCol-startCol)==1){
                self.lock=false;

                self.canvas.removeEventListener("touchmove",touchmovehandler,true);

                self.map.exchange(startRow,startCol,targetRow,targetCol);
            }
        } 
    }
        
    
})();