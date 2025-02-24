import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import FixtureDefinition from '../../../../repository/definition/testcase/testfixturedefintion';
import ElementView from '../../../editors/modelcanvas/elementview';
import Halo from '../../../editors/modelcanvas/halo/halo';
import Properties from '../../../editors/modelcanvas/properties';
import Images from "../../../util/images/images";
import TestCaseCanvas from '../testcasecanvas';


export default class FixtureView extends ElementView<FixtureDefinition> {

    static createNew(canvas: TestCaseCanvas, x = 10, y = 10) {
        if (!canvas.definition.fixture) {
            canvas.definition.fixture = canvas.definition.createDefinition(FixtureDefinition);
        }
        const shape = canvas.diagram.createShape(x, y, 100, 60, canvas.definition.fixture.id);
        return new FixtureView(canvas, canvas.definition.fixture, shape);
    }

    constructor(public canvas: TestCaseCanvas, definition: FixtureDefinition, shape: ShapeDefinition) {
        super(canvas, undefined, definition, shape);
    }

    createProperties() {
        return new Properties(this);
    }

    createHalo(): Halo {
        return new Halo(this);
    }

    get markup() {
        return `<g @selector="scalable">
                    <rect @selector='body' rx="5" ry="5" width="100" height="60" />
                </g>
                <image href="${Images.Test}" x="10" y="10" width="24" height="24" />`;
    }

    get markupAttributes() {
        return {
            body: {
                width: 100,
                height: 60,
            }
        };
    }

    moved(x: number, y: number, newParent: ElementView) {
    }

    /**
     * A planningTable has a fixed position on its parent, it cannot be moved.
     * Position cursor is not relevant
     */
    moving(x: number, y: number) {
        // position planningTable with respect to the parent
        const translateX = 30 - x;

        if (translateX != 0) {
            this.xyz_joint.translate(translateX, 0);
        }
    }

    resizing(w: number, h: number): void {
        super.resizing(w, h);
    }

    __delete() {
        super.__delete();
        delete this.canvas.fixtureView;
    }

}
