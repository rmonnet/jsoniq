import * as _  from "lodash";
import Marker from "./Marker";
import Variable from "./Variable";
import Position from "./parsers/Position";

class StaticWarning extends Marker {
    constructor(pos: Position, code: string, message: string) {
        message = _.template("[<%= code %>]: <%= message %>")({ code: code, message: message });
        super(pos, "warning", "warning", message);
    }
}

export class UnusedVariable extends StaticWarning {
    constructor(v: Variable) {
        var message = _.template("'<%= v %>': unused variable")({ v: v.toString() });
        super(v.getPosition(), "W01", message);
    }
}
