// debug flag
var krs_debug = false;

// global Keycloak object
var keycloak;


/** helper functions **/


/** Routes **/

/*
Home = {
  data: function(){
    return {
      join_inst: false,
      join_group: false,
      experiment: '',
      institution: '',
      remove_institution: '',
      group: '',
      error: '',
      form_error: '',
      group_form_error: '',
      valid: true,
      submitted: false,
      refresh: 0
    }
  },
  asyncComputed: {
    my_experiments: {
      get: async function(){
        if (this.refresh > 0) {
          // refresh token
          await keycloak.updateToken(-1)
        }
        let exps = await get_my_experiments()
        let ret = {}
        for (const exp of exps) {
          ret[exp] = await get_my_institutions(exp)
        }
        return ret
      },
      watch: ['refresh']
    },
    my_groups: {
      get: async function(){
        if (this.refresh > 0) {
          // refresh token
          await keycloak.updateToken(-1)
        }
        let groups = await get_my_groups()
        let ret = {}
        if (this.groups !== null) {
          for (const name in this.groups) {
            if (groups.includes(name))
              ret[name] = this.groups[name]
          }
        }
        return ret
      },
      watch: ['groups','refresh']
    },
    validExperiment: function() {
      try {
        return this.experiment != '' && this.experiments !== null && this.experiment in this.experiments
      } catch(error) {
        return false
      }
    },
    validInstitution: function() {
      try {
        return this.institution != '' && this.institutions !== null && this.institutions.includes(this.institution)
      } catch(error) {
        return false
      }
    },
    experiments: get_all_inst_subgroups,
    institutions: async function() {
      if (this.validExperiment) {
        try {
          let insts = []
          if (this.experiment in this.experiments) {
            if (!(this.experiment in this.my_experiments)) {
              insts = Object.keys(this.experiments[this.experiment])
            } else {
              for (const inst in this.experiments[this.experiment]) {
                if (!(inst in this.my_experiments[this.experiment]))
                  insts.push(inst)
              }
            }
          }
          return insts.sort()
        } catch (error) {
          console.log('error')
          console.log(error)
        }
      }
      return []
    },
    groups: async function() {
        return await get_all_groups();
    },
    validGroup: function() {
      try {
        return this.group != '' && this.groups !== null && this.group in this.groups
      } catch(error) {
        return false
      }
    }
  },
  watch: {
    remove_institution: function(val) {
      this.form_error = ''
      if (val != '') {
        this.join_inst = false
      }
    },
    join_inst: function(val) {
      this.form_error = ''
      if (val)
        this.remove_institution = ''
    },
    join_group: function(val) {
      this.group_form_error = ''
    }
  },
  methods: {
    submit: async function(e) {
      // validate
      this.valid = (this.validExperiment && this.validInstitution)

      // now submit
      if (this.valid) {
        let data = {
          experiment: this.experiment,
          institution: this.institution,
        }
        let confirm_msg = 'Are you sure you want to '
        if (this.remove_institution != '') {
          data.remove_institution = this.remove_institution
          confirm_msg += 'change institutions from '+this.remove_institution+' to '+this.institution+'?'
        } else {
          confirm_msg += 'join the institution '+this.institution+'?'
        }
        if (!window.confirm(confirm_msg)) {
          return;
        }

        this.errMessage = 'Submission processing';
        try {
          await keycloak.updateToken(5);
          const resp = await axios.post('/api/inst_approvals', data, {
            headers: {'Authorization': 'bearer '+keycloak.token}
          });
          console.log('Response:')
          console.log(resp)
          this.form_error = 'Submission successful'
          this.submitted = true
        } catch (error) {
          console.log('error')
          console.log(error)
          let error_message = 'undefined error';
          if (error.response) {
            if ('code' in error.response.data) {
              error_message = 'Code: '+error.response.data['code']+'<br>Message: '+error.response.data['error'];
            } else {
              error_message = JSON.stringify(error.response.data)
            }
          } else if (error.request) {
            error_message = 'server did not respond';
          }
          this.form_error = '<span class="red">Error in submission<br>'+error_message+'</span>'
        }
      } else {
        this.form_error = '<span class="red">Please fix invalid entries</span>'
      }
    },
    submit_group: async function(e) {
      if (this.validGroup) {
        let confirm_msg = 'Are you sure you want to join the group '+this.group+'?'
        if (!window.confirm(confirm_msg)) {
          return;
        }

        this.errMessage = 'Submission processing';
        try {
          await keycloak.updateToken(5);
          let data = {
            group: this.group
          }
          const resp = await axios.post('/api/group_approvals', data, {
            headers: {'Authorization': 'bearer '+keycloak.token}
          });
          console.log('Response:')
          console.log(resp)
          this.form_error = 'Submission successful'
          this.submitted = true
        } catch (error) {
          console.log('error')
          console.log(error)
          let error_message = 'undefined error';
          if (error.response) {
            if ('code' in error.response.data) {
              error_message = 'Code: '+error.response.data['code']+'<br>Message: '+error.response.data['error'];
            } else {
              error_message = JSON.stringify(error.response.data)
            }
          } else if (error.request) {
            error_message = 'server did not respond';
          }
          this.group_form_error = '<span class="red">Error in submission<br>'+error_message+'</span>'
        }
      } else {
        this.group_form_error = '<span class="red">Please fix invalid entries</span>'
      }
    },
    leave_inst_action: async function(exp, inst) {
      let confirm_msg = 'Are you sure you want to leave the institution '+this.inst+'?'
      if (!window.confirm(confirm_msg)) {
        return;
      }

      try {
        await keycloak.updateToken(5);
        const username = await get_username();
        const resp = await axios.delete('/api/experiments/'+exp+'/institutions/'+inst+'/users/'+username, {
          headers: {'Authorization': 'bearer '+keycloak.token}
        });
        console.log('Response:')
        console.log(resp)
        this.refresh = this.refresh+1
      } catch (error) {
        console.log('error')
        console.log(error)
        let error_message = 'undefined error';
        if (error.response && 'data' in error.response) {
          if ('code' in error.response.data) {
            error_message = 'Code: '+error.response.data['code']+'<br>Message: '+error.response.data['error'];
          } else {
            error_message = JSON.stringify(error.response.data)
          }
        } else if (error.request) {
          error_message = 'server did not respond';
        }
        this.error = '<span class="red">Error removing institution<br>'+error_message+'</span>'
      }
    },
    move_inst_action: function(exp, inst) {
      if (this.remove_institution != '') {
        this.experiment = ''
        this.instutition = ''
        this.remove_institution = ''
      } else {
        this.experiment = exp
        this.instutition = ''
        this.remove_institution = inst
      }
    },
    leave_subgroup_action: async function(exp, inst, sub) {
      let confirm_msg = 'Are you sure you want to leave the institution '+inst+' group '+sub+'?'
      if (!window.confirm(confirm_msg)) {
        return;
      }

      try {
        await keycloak.updateToken(5);
        const username = await get_username();
        let data = {}
        data[sub] = false
        for (const subgroup of this.experiments[exp][inst].subgroups) {
          if (sub != subgroup)
            data[subgroup] = true
        }
        const resp = await axios.put('/api/experiments/'+exp+'/institutions/'+inst+'/users/'+username, data, {
          headers: {'Authorization': 'bearer '+keycloak.token}
        });
        console.log('Response:')
        console.log(resp)
        this.refresh = this.refresh+1
      } catch (error) {
        console.log('error')
        console.log(error)
        let error_message = 'undefined error';
        if (error.response && 'data' in error.response) {
          if ('code' in error.response.data) {
            error_message = 'Code: '+error.response.data['code']+'<br>Message: '+error.response.data['error'];
          } else {
            error_message = JSON.stringify(error.response.data)
          }
        } else if (error.request) {
          error_message = 'server did not respond';
        }
        this.error = '<span class="red">Error leaving subgroup<br>'+error_message+'</span>'
      }
    },
    leave_group_action: async function(group_id) {
      let confirm_msg = 'Are you sure you want to leave the group '+this.group+'?'
      if (!window.confirm(confirm_msg)) {
        return;
      }

      try {
        await keycloak.updateToken(5);
        const username = await get_username();
        const resp = await axios.delete('/api/groups/'+group_id+'/'+username, {
          headers: {'Authorization': 'bearer '+keycloak.token}
        });
        console.log('Response:')
        console.log(resp)
        this.refresh = this.refresh+1
      } catch (error) {
        console.log('error')
        console.log(error)
        let error_message = 'undefined error';
        if (error.response && 'data' in error.response) {
          if ('code' in error.response.data) {
            error_message = 'Code: '+error.response.data['code']+'<br>Message: '+error.response.data['error'];
          } else {
            error_message = JSON.stringify(error.response.data)
          }
        } else if (error.request) {
          error_message = 'server did not respond';
        }
        this.error = '<span class="red">Error leaving group<br>'+error_message+'</span>'
      }
    }
  },
  template: `
<article class="home">
  <div v-if="keycloak.authenticated">
    <h2 style="margin-bottom: 1em">My profile:</h2>
    <div class="error_box" v-if="error" v-html="error"></div>
    <h3>Experiments / Institutions</h3>
    <div v-if="$asyncComputed.my_experiments.success">
      <div class="indent" v-for="exp in Object.keys(my_experiments).sort()">
        <p class="italics">{{ exp }}<p>
        <div class="double_indent institution" v-for="inst in Object.keys(my_experiments[exp]).sort()">
          <span class="italics">{{ inst }}</span>
          <button @click="move_inst_action(exp, inst)">Move institutions</button>
          <button @click="leave_inst_action(exp, inst)">Leave institution</button>
          <div class="double_indent" v-if="remove_institution != ''" >
            <form class="newuser" @submit.prevent="submit">
              <div class="entry">
                <p>Select institution:</p>
                <select v-model="institution">
                  <option disabled value="">Please select one</option>
                  <option v-for="inst2 in institutions">{{ inst2 }}</option>
                </select>
                <span class="red" v-if="!validInstitution">invalid entry</span>
              </div>
              <div class="error_box" v-if="form_error" v-html="form_error"></div>
              <div class="entry">
                <input type="submit" value="Submit Move Request">
              </div>
            </form>
          </div>
          <div class="double_indent subgroup" v-for="sub in my_experiments[exp][inst].subgroups">
            <span class="italics">{{ sub }}</span>
            <button @click="leave_subgroup_action(exp, inst, sub)">Leave sub-group</button>
          </div>
        </div>
      </div>
      <div class="indent" v-if="my_experiments.length <= 0">You do not belong to any institutions</div>
      <div class="join">
        <button @click="join_inst = !join_inst">Join an institution</button>
        <div class="double_indent" v-if="join_inst" >
          <form class="newuser" @submit.prevent="submit">
            <div class="entry">
              <p>Select experiment:</p>
              <select v-model="experiment">
                <option disabled value="">Please select one</option>
                <option v-for="exp in Object.keys(experiments).sort()">{{ exp }}</option>
              </select>
              <span class="red" v-if="!valid && !validExperiment">invalid entry</span>
            </div>
            <div class="entry">
              <p>Select institution:</p>
              <select v-model="institution">
                <option disabled value="">Please select one</option>
                <option v-for="inst in institutions">{{ inst }}</option>
              </select>
              <span class="red" v-if="!valid && !validInstitution">invalid entry</span>
            </div>
            <div class="error_box" v-if="form_error" v-html="form_error"></div>
            <div class="entry" v-if="!submitted">
              <input type="submit" value="Submit Join Request">
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="indent" v-else>Loading institution information...</div>
    <h3>Groups</h3>
    <div v-if="$asyncComputed.my_groups.success">
      <div class="indent group" v-for="grp in Object.keys(my_groups).sort()">
        <span class="italics">{{ grp }}</span>
        <button @click="leave_group_action(my_groups[grp])">Leave group</button>
      </div>
      <div class="indent" v-if="my_groups.length <= 0">You do not belong to any groups</div>
    </div>
    <div class="indent" v-else>Loading group information...</div>
    <div class="join">
      <button @click="join_group = !join_group">Join a group</button>
      <div class="double_indent" v-if="join_group" >
        <form class="newuser" @submit.prevent="submit_group">
          <div class="entry">
            <p>Select group:</p>
            <select v-model="group">
              <option disabled value="">Please select one</option>
              <option v-for="grp in Object.keys(groups).sort()">{{ grp }}</option>
            </select>
            <span class="red" v-if="!validGroup">invalid entry</span>
          </div>
          <div class="error_box" v-if="group_form_error" v-html="group_form_error"></div>
          <div class="entry">
            <input type="submit" value="Submit Join Request">
          </div>
        </form>
      </div>
    </div>
  </div>
  <div v-else>
    <h3>Welcome to the IceCube Neutrino Observatory identity management console.</h3>
    <p>Existing users should <span style="font-size: 150%"><login></login></span></p>
    <p>New users should ask their PI for a registration link.</p>
  </div>
</article>`
}

UserInfo = {
  data: function(){
    return {
      title: ''
    }
  },
  asyncComputed: {
    userinfo: async function() {
      if (!keycloak.authenticated)
        return {}
      try {
        var ret = await keycloak.loadUserInfo();
        return ret
      } catch (error) {
        return {"error": JSON.stringify(error)}
      }
    }
  },
  template: `
<article class="user-info">
  <h2>User details:</h2>
  <div v-for="(value, name) in userinfo">{{ name }}: {{ value }}</div>
</article>`
}

Register = {
  data: function(){
    return {
      experiment: '',
      institution: '',
      firstName: '',
      lastName: '',
      authorListName: '',
      email: '',
      valid: true,
      errMessage: '',
      submitted: false
    }
  },
  props: ['experiment', 'institution'],
  computed: {
    validFirstName: function() {
      return this.firstName
    },
    validLastName: function() {
      return this.lastName
    },
    validAuthorListName: function() {
      return this.authorListName
    },
    validEmail: function() {
      return this.email.indexOf('@',1) > 0
    }
  },
  asyncComputed: {
    validExperiment: function() {
      try {
        return this.experiment != '' && this.experiments !== null && this.experiment in this.experiments
      } catch(error) {
        return false
      }
    },
    validInstitution: function() {
      try {
        return this.institution != '' && this.experiments !== null && this.experiment in this.experiments && this.institution in this.experiments[this.experiment]
      } catch(error) {
        return false
      }
    },
    experiments: get_all_inst_subgroups,
    institutions: function() {
      try {
        return this.experiments[this.experiment]
      } catch(error) {
        return {}
      }
    }
  },
  methods: {
      submit: async function(e) {
          // validate
          this.valid = (this.validExperiment && this.validInstitution && this.validFirstName
                  && this.validLastName && (!this.authorListName || this.validAuthorListName)
                  && this.validEmail)

          // now submit
          if (this.valid) {
              this.errMessage = 'Submission processing';
              try {
                  const resp = await axios.post('/api/inst_approvals', {
                      experiment: this.experiment,
                      institution: this.institution,
                      first_name: this.firstName,
                      last_name: this.lastName,
                      author_name: this.authorListName,
                      email: this.email
                  });
                  console.log('Response:')
                  console.log(resp)
                  this.errMessage = 'Submission successful'
                  this.submitted = true
              } catch (error) {
                  console.log('error')
                  console.log(error)
                  let error_message = 'undefined error';
                  if (error.response) {
                      if ('code' in error.response.data) {
                          error_message = 'Code: '+error.response.data['code']+'<br>Message: '+error.response.data['error'];
                      } else {
                          error_message = JSON.stringify(error.response.data)
                      }
                  } else if (error.request) {
                      error_message = 'server did not respond';
                  }
                  this.errMessage = '<span class="red">Error in submission<br>'+error_message+'</span>'
              }
          } else {
              this.errMessage = '<span class="red">Please fix invalid entries</span>'
          }
      }
  },
  template: `
<article class="register">
    <h2>Register a new account</h2>
    <form class="newuser" @submit.prevent="submit" v-if="$asyncComputed.experiments.success">
      <div class="entry">
        <span class="red">* entry is requred</span>
      </div>
      <div class="entry">
        <p>Select your experiment: <span class="red">*</span></p>
        <select v-model="experiment">
          <option disabled value="">Please select one</option>
          <option v-for="exp in Object.keys(experiments).sort()">{{ exp }}</option>
        </select>
        <span class="red" v-if="!valid && !validExperiment">invalid entry</span>
      </div>
      <div class="entry">
        <p>Select your institution: <span class="red">*</span></p>
        <select v-model="institution">
          <option disabled value="">Please select one</option>
          <option v-for="inst in Object.keys(institutions).sort()">{{ inst }}</option>
        </select>
        <span class="red" v-if="!valid && !validInstitution">invalid entry</span>
      </div>
      <textinput name="First Name" inputName="first_name" v-model.trim="firstName"
       required=true :valid="validFirstName" :allValid="valid"></textinput>
      <textinput name="Last Name" inputName="last_name" v-model.trim="lastName"
       required=true :valid="validLastName" :allValid="valid"></textinput>
      <textinput name="Author List Name (usually abbreviated)" inputName="authorname"
       v-model.trim="authorListName" :valid="validAuthorListName" :allValid="valid"></textinput>
      <textinput name="Email Address" inputName="email" v-model.trim="email"
       required=true :valid="validEmail" :allValid="valid"></textinput>
      <div v-if="errMessage" class="error_box" v-html="errMessage"></div>
      <div class="entry" v-if="!submitted">
        <input type="submit" value="Submit Registration">
      </div>
    </form>
</article>`
}*/

Vue.component('vue-display', {
  data: function(){
    return {}
  },
  props: {
    insts: {
      type: Object,
      required: true
    },
    users: {
      type: Object,
      required: true
    },
    filtered_users: {
      type: Array,
      required: true
    }
  },
  computed: {
    my_users: function() {
      let ret = []
      for (const user of this.filtered_users) {
        //console.log('examining user '+user)
        if (user in this.users) {
          //console.log('pushing user '+this.users[user].username)
          ret.push(this.users[user])
        } else {
          console.log('missing user '+user);
        }
      }
      ret.sort((a,b)=>{return a.lastName+a.firstName > b.lastName+b.firstName})
      console.log(ret)
      return ret
    }
  },
  methods: {
    inst_name: function(group_path) {
      if (group_path in this.insts) {
        return this.insts[group_path].name
      }
      return ''
    }
  },
  template: `<div class="user_list">
<div class="user" v-for="user in my_users" :key="user.username">
  <div class="name">{{ user.lastName }}, {{ user.firstName }}</div>
  <div class="user-insts"><span v-for="group_path in user.institutions">{{ inst_name(group_path) }}</span></div>
  <div class="phone">{{ user.mobile }}</div>
  <div class="email">{{ user.email }}</div>
</div></div>`,
})

Vue.component('account', {
  data: function(){
    return {}
  },
  methods: {
  },
  template: `
<div class="account">
Signed in as <span class="username">{{ name }}</span>
</div>`
});


async function vue_startup(insts, users){
  let inst_select = [{name: "All", value: "all"}]
  for (const group_path in insts) {
    const inst = insts[group_path]
    inst_select.push({
      name: inst.name,
      value: group_path
    })
  }
  let filtered_users = []
  for (const username in users) {
    filtered_users.push(username)
  }
  var app = new Vue({
    el: '#page-container',
    data: {
      insts: insts,
      users: users,
      inst_select: inst_select,
      filtered_users: filtered_users
    },
    methods: {
      filter: function(){
        let new_users = []
        let selected = document.getElementById('filter').value
        if (selected == 'all') {
          for (const username in this.users) {
            new_users.push(username)
          }
        } else {
          if (selected in this.insts) {
            new_users = this.insts[selected]['members'].slice()
          }
        }
        this.filtered_users = new_users;
      }
    }
  })
}
