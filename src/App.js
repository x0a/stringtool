import React, { Component, Fragment } from 'react';
import {
  Container, Row, Col,
  Button, InputGroup, Input,
  InputGroupAddon, Navbar, NavbarBrand,
  Card
} from "reactstrap";
import './App.css';
import RadixConverter from "./RadixConverter.js";
import memoizeOne from 'memoize-one';

class App extends Component {
  constructor(props) {
    super(props);

    this.calculate = this.calculate.bind(this);
    this.edit = this.edit.bind(this);

    this.state = {
      string: "Enter a string here",
      stringArr: [],
      radix: 0
    };
  }


  edit(radix, digits) {
    this.setState({
      radix: radix,
      string: digits.join(radix === 0 ? "" : " "),
    });
  }

  calculate(string, stringArr) {
    this.setState({ stringArr: stringArr })
  }

  render() {
    return (
      <div>
        <Navbar color="dark" dark>
          <NavbarBrand href="/">String Tool</NavbarBrand>
        </Navbar>
        <Container>

          <Row>
            <Col>
              <StringEditor
                input={this.state.string}
                radix={this.state.radix}
                calculate={this.calculate}
              />
            </Col>
          </Row>
          <Row>
            <RadixContainer
              input={this.state.stringArr}
              onEdit={this.edit}
              bases={[0, 10, 16, 8, 2, -1]}
            />
          </Row>
        </Container>
      </div>
    );
  }
}

class StringEditor extends Component {
  // This acts as an uncontrolled component.
  // Does not send any changes up to the parent.
  // And the parent does not control its contents.
  // When the parent changes its props, this component accepts the changes.
  // But does not attempt to keep its contents in sync with the parent, for performance reasons.
  constructor(props) {
    super(props);

    this.changeHandler = this.changeHandler.bind(this);
    this.convert = this.convert.bind(this);

    this.calculate = props.calculate;
    this.state = {
      string: props.input || "",
      radix: props.radix || 0,
      delimeter: props.radix > 0 ? " " : "",
      regex: false
    };
    this.updateRadix = memoizeOne(radix => this.setState({ radix: radix, delimeter: radix > 0 ? " " : "" }));
    this.updateString = memoizeOne(string => this.setState({ string: string }));
    this.getDelimeterEditor = memoizeOne(this.getDelimeterEditor)
  }
  componentDidMount() {
    this.convert();
  }

  componentWillReceiveProps(nextProps, prevProps) {
    this.updateRadix(nextProps.radix);
    this.updateString(nextProps.input);
  }

  changeHandler(event) {
    let state = {};

    if (event.target.name === "inputStr") {
      state.string = event.target.value;
    } else if (event.target.id === "type") {
      state.radix = ~~event.target.value;
      state.delimeter = state.radix > 0 ? " " : "";
    } else if (event.target.name === "delimeter") {
      state.delimeter = event.target.value;
    }

    this.setState(state);
  }

  convert() {
    const delimeter = this.state.regex ? new RegExp(this.state.delimeter) : this.state.delimeter;

    this.calculate(this.state.string, this.state.string.split(delimeter).map(char => {
      if (this.state.radix === 0)
        return char.charCodeAt(0)
      else
        return RadixConverter.convertBase(char, this.state.radix, 10)
    })
    )
  }

  selectAll(event) {
    event.target.selectionStart = 0;
    event.target.selectionEnd = event.target.value.length;
  }

  getDelimeterEditor(radix, delimeter, regex) {
    if (radix > 0) {
      let delimeterDisplay;

      if (delimeter.length) {
        let delimeterText;
        if (regex) {
          delimeterText = "/" + delimeter + "/g";
        } else {
          delimeterText = delimeter.split("")
            .map(char => "0x" + RadixConverter.convertBase(char.charCodeAt(0), 10, 16))
            .join(" ")
        }
        delimeterDisplay = <kbd className="delimeter">{delimeterText}</kbd>;
      }

      return (<Fragment>
        <Col lg="4" md="5" className="mb-1">
          <InputGroup>
            <InputGroupAddon addonType="prepend">Delimeter</InputGroupAddon>
            <InputGroupAddon addonType="prepend">
              <Button color="secondary" outline active={regex} onClick={() => {
                this.setState({ regex: !regex });
              }}>
                Regex
              </Button>
            </InputGroupAddon>
            <Input placeholder="Delimeter" name="delimeter" value={delimeter} onChange={this.changeHandler} />
          </InputGroup>
        </Col>
        <Col lg="4" md="3">
          {delimeterDisplay}
        </Col>
      </Fragment>);
    }
  }

  render() {
    return <Card body className="text-right">
      <Row>
        <Col lg="3" md="4" className="mb-1">
          <InputGroup>
            <InputGroupAddon addonType="prepend">Input Type</InputGroupAddon>
            <select className="form-control" id="type" onChange={this.changeHandler} value={this.state.radix}>
              <option value="0">Plaintext</option>
              <option value="10">Decimal</option>
              <option value="16">Hex</option>
              <option value="2">Binary</option>
              <option value="8">Octal</option>
            </select>
          </InputGroup>
        </Col>
        {this.getDelimeterEditor(this.state.radix, this.state.delimeter, this.state.regex)}
      </Row>
      <Input
        name="inputStr"
        type="textarea"
        value={this.state.string}
        spellCheck="false"
        placeholder="Enter a string here"
        onChange={this.changeHandler}
        onFocus={this.selectAll}
        autoFocus="true"
      />
      <div>
        <span className="float-left length">Input length: <strong>{this.state.string.length}</strong></span>
        <Button className="float-right" color="primary" onClick={this.convert}>Convert</Button>
      </div>
    </Card>
  }
}

class RadixContainer extends Component {
  // Takes the "push state up" concept, but rather than
  // altering the state, we take the update (hover/select)
  // and push it to its children. The children do not alter their state
  // they alter their DOM children directly. 
  // This avoids expensive re-rendering due to state change.
  // Since our changes are CSS-only, we don't lose any functionality.

  constructor(props) {
    super(props);
    this.hover = this.hover.bind(this);
    this.select = this.select.bind(this);
    this.addRef = this.addRef.bind(this);

    this.onEdit = props.onEdit;
    this.bases = props.bases;
    this.instances = [];

    this.state = { stringArr: [] };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.input) {
      this.setState({ stringArr: nextProps.input })
    }
  }

  select(key) {
    for (let inst of this.instances)
      inst.setSelect(key);

  }

  hover(key) {
    for (let inst of this.instances)
      inst.setHover(key);

  }

  addRef(inst) {
    this.instances.push(inst);
  }

  render() {
    return <Col>
      {
        this.bases.map(radix =>
          <RadixConverter
            key={radix}
            ref={this.addRef}
            radix={radix}
            input={this.state.stringArr}
            onSelect={this.select}
            onHover={this.hover}
            onEdit={this.onEdit} />)
      }
    </Col>
  }
}

export default App;
