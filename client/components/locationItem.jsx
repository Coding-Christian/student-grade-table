import React from 'react';
import LocationEdit from './locationEdit';

class LocationItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name,
      description: props.description,
      error: null,
      editing: false
    };
    this.id = props.locationId;
    this.onDelete = props.onDelete;
    this.onUpdate = props.onUpdate;
    this.handleDelete = this.handleDelete.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.updateInfo = this.updateInfo.bind(this);
  }
  async handleDelete() {
    if (!this.state.editing) {
      const status = await this.onDelete('locations', this.id);
      if (status >= 300) {
        this.setState({ error: status }, () =>
          setTimeout(() => this.setState({ error: null }), 3000)
        );
      }
    }
  }
  updateInfo(name, description) {
    this.setState({ name, description }, this.toggleEdit);
  }
  toggleEdit() {
    this.setState({ editing: !this.state.editing });
  }
  render() {
    let error = '';
    let infoElems;
    if (this.state.error === 409) {
      error = (
        <div className="col-12 my-1">
          <small className='text-danger'>Please move groceries in this location before deleteing.</small>
        </div>
      );
    } else if (this.state.error) {
      error = (
        <div className="col-12 my-1">
          <small className='text-danger'>{this.state.error} Error occurred. Please try again.</small>
        </div>
      );
    }
    if (this.state.editing) {
      infoElems = (
        <LocationEdit
          id={this.id}
          name={this.state.name}
          description={this.state.description}
          onUpdate={this.onUpdate}
          updateInfo={this.updateInfo}
        />
      );
    } else {
      infoElems = [
        <td key='name'>{this.state.name}</td>,
        <td key='description'>{this.state.description}</td>
      ];
    }
    return (
      <tr>
        {infoElems}
        <td key='operations'>
          <div className="row">
            <div className='col-12 col-xl-6 my-1'>
              <button onClick={this.toggleEdit} className='btn btn-outline-info w-100'>
                {this.state.editing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <div className='col-12 col-xl-6 my-1'>
              <button onClick={this.handleDelete} className={`btn btn-danger w-100 ${this.state.editing ? 'disabled' : ''}`}>
                Delete
              </button>
            </div>
            {error}
          </div>
        </td>
      </tr>
    );
  }
}

export default LocationItem;
