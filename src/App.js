import React, { Component } from 'react';
import {
  Container, Row, Col,
  Button, InputGroup, Input,
  InputGroupAddon, Navbar, NavbarBrand,
  Card
} from "reactstrap";
import './App.css';
import RadixConverter from "./RadixConverter.js";

class App extends Component {
  constructor(props) {
    super(props);

    this.calculate = this.calculate.bind(this);
    this.edit = this.edit.bind(this);

    this.state = {
      string: "Enter a string here",
      stringArr: [],
      radix: 0,
      delimeter: "",
      regex: false
    };
  }


  edit(radix, digits) {
    this.setState({
      radix: radix,
      string: digits.join(radix === 0 ? "" : " "),
    });
  }

  calculate(string, stringArr) {
    this.setState({ string: string, stringArr: stringArr })
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
  constructor(props) {
    super(props);
    
    this.changeHandler = this.changeHandler.bind(this);
    this.convert = this.convert.bind(this);

    this.calculate = props.calculate;
    this.state = {
      string: props.input || "",
      radix: props.radix || 0,
      delimeter: props.radix === 0 ? "" : " ",
      regex: false
    };
  }

  componentWillReceiveProps(nextProps){
    this.setDelimeter(nextProps.radix > 0 ? " " : "", this.state.regex);
    this.setState({
      string: nextProps.input,
      radix: nextProps.radix
    })
  }
  changeHandler(event) {
    let state = {};

    if (event.target.name === "inputStr") {
      state.string = event.target.value;
    } else if (event.target.id === "type") {
      state.radix = ~~event.target.value;
      this.setDelimeter(state.radix > 0 ? " " : "", this.state.regex);
    } else if (event.target.name === "delimeter") {
      return this.setDelimeter(event.target.value, this.state.regex);
    }

    this.setState(state);
  }

  setDelimeter(delimeter, regex) {
    let state = {
      delimeter: delimeter
    };

    if (regex) {
      state.delimeterDisplay = "/" + delimeter + "/g";
    } else {
      state.delimeterDisplay = delimeter.split("")
        .map(char => "0x" + RadixConverter.convertBase(char.charCodeAt(0), 10, 16))
        .join(" ")
    }

    this.setState(state);
  }

  componentDidMount() {
    this.convert();
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
        {(this.state.radix > 0 ?
          [<Col lg="4" md="5" key="delimeterSet" className="mb-1">
            <InputGroup>
              <InputGroupAddon addonType="prepend">Delimeter</InputGroupAddon>
              <InputGroupAddon addonType="prepend">
                <Button color="secondary" outline active={this.state.regex} onClick={
                  () => {
                    this.setDelimeter(this.state.delimeter, !this.state.regex);
                    this.setState({ regex: !this.state.regex });
                  }
                }>
                  Regex
              </Button>
              </InputGroupAddon>
              <Input placeholder="Delimeter" name="delimeter" value={this.state.delimeter} onChange={this.changeHandler} />
            </InputGroup>
          </Col>,
          <Col lg="4" md="3" key="delimeterShow">
            {this.state.delimeter.length ? <kbd className="delimeter">{this.state.delimeterDisplay}</kbd> : undefined}
          </Col>]
          : undefined)
        }
      </Row>
      <textarea name="inputStr" className="form-control" placeholder="Enter a string here" onChange={this.changeHandler} value={this.state.string} onFocus={this.selectAll} autoFocus="true"></textarea>
      <div>
        <span className="float-left length">Input length: <strong>{this.state.string.length}</strong></span>
        <Button className="float-right" color="primary" onClick={this.convert}>Convert</Button>
      </div>
    </Card>
  }
}

class RadixContainer extends Component {
  constructor(props) {
    super(props);
    this.hover = this.hover.bind(this);
    this.select = this.select.bind(this);
    this.addRef = this.addRef.bind(this);
    this.onEdit = props.onEdit;
    this.bases = props.bases;
    this.state = { stringArr: [] };
    this.instances = [];
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.input) {
      this.setState({ stringArr: nextProps.input })
    }
  }

  select(key) {
    for (let inst of this.instances) {
      inst.setSelect(key);
    }
  }

  hover(key) {
    for (let inst of this.instances) {
      inst.setHover(key);
    }
  }

  addRef(inst) {
    this.instances.push(inst);
  }

  render() {
    return <Col>
      {this.bases.map(radix =>
        <RadixConverter
          ref={this.addRef}
          radix={radix}
          input={this.state.stringArr}
          onSelect={this.select}
          onHover={this.hover}
          onEdit={this.onEdit} />
      )}</Col>
  }
}

export default App;
