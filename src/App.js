import React, { Component } from 'react';
import {
  Container, Row, Col,
  Button, InputGroup, Input, InputGroupAddon,
  Navbar, NavbarBrand,
  Card, CardText, CardTitle
} from "reactstrap";
import './App.css';
import memoizeOne from 'memoize-one';

class App extends Component {
  constructor(props) {
    super(props);

    this.changeHandler = this.changeHandler.bind(this);
    this.convert = this.convert.bind(this);
    this.newHover = this.newHover.bind(this);
    this.edit = this.edit.bind(this);
    this.select = this.select.bind(this);
    this.selectAll = this.selectAll.bind(this);

    this.state = {
      string: "Enter a string here",
      stringArr: [],
      hover: -1,
      select: -1,
      radix: 0,
      delimeter: "",
      regex: false,
      delimeterDisplay: ""
    };
  }

  changeHandler(event) {
    if (event.target.name === "inputStr") {
      this.setState({ string: event.target.value })
    } else if (event.target.id === "type") {
      let radix = ~~event.target.value;
      let delimeter = radix > 0 ? " " : "";
      this.setState({ radix: radix, delimeter: delimeter, delimeterDisplay: this.getDelimeterDisplay(delimeter, this.state.regex) });
    } else if (event.target.name === "delimeter") {
      let delimeter = event.target.value;
      this.setState({ delimeter: delimeter, delimeterDisplay: this.getDelimeterDisplay(delimeter, this.state.regex) });
    }
  }

  componentDidMount() {
    this.convert();
  }
  getDelimeterDisplay(delimeter, regex) {
    if (regex) {
      console.log("/" + JSON.stringify(delimeter) + "/g")
      return "/" + delimeter + "/g";
    } else {
      return delimeter.split("").map(char => "0x" + RadixConverter.convertBase(char.charCodeAt(0), 10, 16)).join(" ")
    }
  }
  convert() {
    let delimeter = this.state.regex ? new RegExp(this.state.delimeter) : this.state.delimeter;

    this.setState({
      stringArr: this.state.string.split(delimeter).map(char => {
        if (this.state.radix === 0)
          return char.charCodeAt(0)
        else
          return RadixConverter.convertBase(char, this.state.radix, 10)
      })
    })
  }
  select(key) {
    this.setState({ select: key });
  }
  edit(radix, digits) {
    this.setState({
      radix: radix,
      string: digits.join(radix === 0 ? "" : " "),
      regex: false,
      delimeter: radix > 0 ? " " : ""
    });
  }

  newHover(key) {
    this.setState({ hover: key });
  }

  selectAll(event) {
    event.target.selectionStart = 0;
    event.target.selectionEnd = event.target.value.length;
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
              <Card body className="text-right">
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
                          <Button color="secondary" outline active={this.state.regex} onClick={() => this.setState({ regex: !this.state.regex, delimeterDisplay: this.getDelimeterDisplay(this.state.delimeter, !this.state.regex) })}>Regex</Button>
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
            </Col>
          </Row>
          <Row>
            <Col>
              <RadixConverter radix="0" input={this.state.stringArr} select={this.state.select} onSelect={this.select} hover={this.state.hover} onHover={this.newHover} onEdit={this.edit} />
              <RadixConverter radix="10" input={this.state.stringArr} select={this.state.select} onSelect={this.select} hover={this.state.hover} onHover={this.newHover} onEdit={this.edit} />
              <RadixConverter radix="16" input={this.state.stringArr} select={this.state.select} onSelect={this.select} hover={this.state.hover} onHover={this.newHover} onEdit={this.edit} />
              <RadixConverter radix="8" input={this.state.stringArr} select={this.state.select} onSelect={this.select} hover={this.state.hover} onHover={this.newHover} onEdit={this.edit} />
              <RadixConverter radix="2" input={this.state.stringArr} select={this.state.select} onSelect={this.select} hover={this.state.hover} onHover={this.newHover} onEdit={this.edit} />
              <RadixConverter radix="-1" input={this.state.stringArr} select={this.state.select} onSelect={this.select} hover={this.state.hover} onHover={this.newHover} onEdit={this.edit} />
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

class RadixConverter extends Component {
  constructor(props) {
    super(props);

    this.edit = this.edit.bind(this);

    if (props.radix) {
      this.radix = ~~props.radix;
    } else {
      this.radix = 10;
    }

    if (this.radix === -1) {
      this.radixName = "UTF-8";
      this.description = "Translation of binary Unicode code points"
    } else if (this.radix === 0) {
      this.radixName = "Text"
    } else if (this.radix === 2) {
      this.radixName = "Binary";
    } else if (this.radix === 8) {
      this.radixName = "Octal";
    } else if (this.radix === 10) {
      this.radixName = "Decimal";
    } else if (this.radix === 16) {
      this.radixName = "Hexadecimal";
    }

    this.memoizeInputProp = memoizeOne((input) => this.setState({ input: this.convert(input, this.radix) }));
    this.state = { input: this.convert(props.input || [], this.radix), hovering: -1, selected: -1 };
  }

  componentWillReceiveProps(newProps) {
    this.memoizeInputProp(newProps.input);
    this.setState({ hovering: newProps.hover, selected: newProps.select })
  }

  convert(numbers, to) {
    return numbers.map(digit => {
      if (typeof digit === "number" && isNaN(digit))
        return "NaN";
      else if (to > 0)
        return RadixConverter.convertBase(digit, 10, to)
      else if (to === 0)
        return String.fromCharCode(digit);
      else if (to === -1) {
        let digits = this.dec2utf8(digit);

        if (typeof digits !== "object")
          return "NaN";
        else
          return digits.map(number => number.toString(2).padStart(8, "0")).join(" ");
      }
    })
  }
  // lot of research and tinkering went into this shit.., for a performance gain of only 60%
  // but it was still rewarding
  dec2utf8(number) {
    if (isNaN(number) || number < 0)
      return NaN;
    else if (number < 0x80) // 7 bits or less
      return [number];
    else if (number < 0x800) // 11 bits or less
      return [((number >> 6) & 0x3f) | 0xc0, (number & 0x3f) | 0x80];
    else if (number < 0x10000) // 16 bits or less
      return [((number >> 12) & 0x3f) | 0xe0, ((number >> 6) & 0x3f) | 0x80, (number & 0x3f) | 0x80];
    else if (number < 0x200000) // 21 bits or less
      return [((number >> 18) & 0x3f) | 0xf0, ((number >> 12) & 0x3f) | 0x80, ((number >> 6) & 0x3f) | 0x80, (number & 0x3f) | 0x80];
    else
      return NaN;
  }

  static convertBase(number, from, to) {
    const codetable = [
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", // Using an array here makes this function
      "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", // nearly 60% faster than a string
      "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", // at least for binary values.
      "U", "V", "W", "X", "Y", "Z"
    ];

    if (isNaN(number) && typeof number === "number") return NaN;

    if (from === 10) {
      number = parseInt(number, 10);

      if (to === 10) return number;
      if (codetable.length < to || number < 0) return NaN;

      let digits = [];

      do {
        let remainder = number % to;
        digits.push(codetable[remainder]);
        number = (number - remainder) / to;
      } while (number !== 0)

      return digits.reverse().join("");
    } else if (to === 10) {
      let out = 0;

      if (from > 10) number = number.toUpperCase(); //try not to perform this needlessly

      for (let i = number.length - 1; i !== -1; i--) {
        let val = codetable.indexOf(number[i]);
        if (val === -1 || val > from) return NaN;
        out += val * (from ** (number.length - i - 1));
      }

      return out;
    } else {
      return RadixConverter.convertBase(RadixConverter.convertBase(number, from, 10), 10, to);
    }
  }



  hover(key) {
    if (this.props.onHover) {
      this.props.onHover(key);
    }
  }

  unhover(key) {
    if (key === this.state.hovering)
      this.hover(-1);
  }

  select(key, event) {
    if (this.props.onSelect) {
      if (key === this.state.selected) {
        this.props.onSelect(-1);
      } else {
        this.props.onSelect(key);
      }
    }
    let selection = getSelection();
    let range = document.createRange();

    range.selectNodeContents(event.target);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  edit() {
    if (this.props.onEdit) {
      let radix = this.radix !== -1 ? this.radix : 2;
      let input = this.radix !== -1 ? this.state.input : this.state.input.join(" ").split(" ");

      this.props.onEdit(radix, input);
    }
  }

  render() {
    return (
      <Card body className="radix-converter">
        <CardTitle>
          <strong>{this.radixName}</strong>
          {
            this.description ?
              <small className="text-muted">{this.description}</small>
              : undefined
          }
          {
            this.props.onEdit &&
            <Button size="sm" color="secondary" onClick={this.edit} className="edit-button float-right" href="#">
              Edit
            </Button>
          }
        </CardTitle>
        <CardText>{
          this.state.input.map((digit, key) =>
            <span
              className={
                "digit "
                + (key === this.state.hovering ? "hover" : "")
                + " "
                + (key === this.state.selected ? "select" : "")
              }
              onMouseEnter={this.hover.bind(this, key)}
              onMouseLeave={this.unhover.bind(this, key)}
              onClick={this.select.bind(this, key)}
              key={key}
            >
              {"" + digit}
            </span>)
        }
        </CardText>
      </Card>
    )
  }
}

export default App;
