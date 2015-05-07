import _ = require("lodash");

import ASTNode = require("./parsers/ASTNode");
import StaticContext = require("./StaticContext");
import RootStaticContext = require("./RootStaticContext");

import Marker = require("./Marker");

import DynamicContext = require("../runtime/iterators/Iterator");
import Iterator = require("../runtime/iterators/Iterator");
import ItemIterator = require("../runtime/iterators/ItemIterator");
import AdditiveIterator = require("../runtime/iterators/AdditiveIterator");
import RangeIterator = require("../runtime/iterators/RangeIterator");
import SequenceIterator = require("../runtime/iterators/SequenceIterator");
import MultiplicativeIterator = require("../runtime/iterators/MultiplicativeIterator");
import flwor = require("../runtime/iterators/flwor");


class Translator {

    private ast: ASTNode;

    private marker: Marker[];

    private iterators: Iterator[] = [];

    private clauses: flwor.Clause[];
    private clause: flwor.Clause;
    private clausesCount: number[];

    private rootSctx: RootStaticContext;

    private sctx: StaticContext;
    private dctx: DynamicContext;

    constructor(rootSctx: RootStaticContext, ast: ASTNode) {
        this.rootSctx = rootSctx;
        this.sctx = rootSctx;
        this.dctx = new DynamicContext();
        this.ast = ast;
    }

    private pushCtx(pos: Position): Translator {
        this.dctx = this.dctx.createContext();
        this.sctx = this.sctx.createContext();
        return this;
    }

    private popCtx = function(pos: Position): Translator {
        this.sctx = this.sctx.getParent();
        this.dctx = this.dctx.getParent();
        return this;
    }

    compile(): Iterator {
        this.visit(this.ast);
        if(this.iterators.length !== 1) {
            throw new Error("Invalid query plan.");
        }
        return this.iterators[0];
    }

    getMarkers(): Marker[] {
        return this.marker;
    }

    Expr(node: ASTNode): boolean {
        this.visitChildren(node);
        this.iterators.push(new SequenceIterator(this.iterators.splice(0, this.iterators.length)));
        return true;
    }

    FLWORExpr(node: ASTNode): boolean {
        this.pushCtx(node.getPosition());
        this.clauses.push(new flwor.EmptyClause());
        this.clausesCount.push(0);
        this.visitChildren(node);
        this.clauses.pop();
        this.clause = this.clauses[this.clauses.length - 1];
        var clauseCount = this.clauses.pop();
        for(var i = 1; i <= clauseCount; i++) {
            this.popCtx(node.getPosition());
        }
        this.popCtx(node.getPosition());
        return true;
    }

    ForBinding(node: ASTNode): boolean {
        this.pushCtx(node.getPosition());
        this.visitChildren(node);
        this.clausesCount[this.clausesCount.length - 1]++;
        this.clause = new flwor.ForClause(this.clause, "i", false, "a", this.iterators.pop());
        return true;
    }

    ReturnClause(node: ASTNode): boolean {
        this.visitChildren(node);
        this.iterators.push(new flwor.ReturnIterator(this.clause, this.iterators.pop()));
        return true;
    }

    VarRef(node: ASTNode): boolean {
        var varName = node.find(['VarName'])[0].toString();
        this.iterators.push(new VarRefIterator(this.dctx, varName));
        return true;
    }

    RangeExpr(node: ASTNode): boolean {
        this.visitChildren(node);
        var to = this.iterators.pop();
        var f = this.iterators.pop();
        this.iterators.push(new RangeIterator(f, to));
        return true;
    }

    //AdditiveExpr ::= MultiplicativeExpr ( ( '+' | '-' ) MultiplicativeExpr )*
    AdditiveExpr(node: ASTNode): boolean {
        this.visitChildren(node);
        node.find(["TOKEN"]).forEach((token: ASTNode) => {
            this.iterators.push(
                new AdditiveIterator(
                    this.iterators.pop(),
                    this.iterators.pop(),
                    token.getValue() === "+"
                )
            );
        });
        return true;
    }

    //MultiplicativeExpr ::= UnionExpr ( ( '*' | 'div' | 'idiv' | 'mod' ) UnionExpr )*
    MultiplicativeExpr(node: ASTNode): boolean {
        this.visitChildren(node);
        node.find(["TOKEN"]).forEach((token: ASTNode) => {
            this.iterators.push(
                new MultiplicativeIterator(
                    this.iterators.pop(),
                    this.iterators.pop(),
                    token.getValue()
                )
            );
        });
        return true;
    }

    DecimalLiteral(node: ASTNode): boolean {
        this.iterators.push(new ItemIterator(parseFloat(node.getValue())));
        return true;
    }

    IntegerLiteral(node: ASTNode): boolean {
        this.iterators.push(new ItemIterator(parseInt(node.getValue(), 10)));
        return true;
    }
/*
    VarRef(node: ASTNode): boolean {
        var ns = '';
        var varName = 'a';
        this.iterators.push(new VarRefIterator(this.dctx, ns, varName));
    }
*/
    visit(node: ASTNode): Translator {
        var name = node.getName();
        var skip = false;

        if (typeof this[name] === "function") {
            skip = this[name](node) === true;
        }

        if (!skip) {
            this.visitChildren(node);
        }
        return this;
    }

    visitChildren(node: ASTNode): Translator {
        node.getChildren().forEach(child => {
            this.visit(child);
        });
        return this;
    }
}

export = Translator;
