
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
    },
    filtered_insts: {
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
      ret.sort((a,b)=>{return (a.lastName+a.firstName).toLowerCase() > (b.lastName+b.firstName).toLowerCase()})
      console.log(ret)
      return ret
    },
    leads: function() {
      let ret = {}
      for (const group_path of this.filtered_insts) {
        if ('institutionLeadUid' in this.insts[group_path]) {
          let leadUids = []
          if (Array.isArray(this.insts[group_path].institutionLeadUid)) {
            leadUids = this.insts[group_path].institutionLeadUid
          } else {
            leadUids = [this.insts[group_path].institutionLeadUid]
          }
          for (const user of leadUids) {
            ret[user] = user
          }
        }
      }
      console.log('leads')
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
  <div class="name">{{ user.lastName }}, {{ user.firstName }}<span v-if="user.username in leads"> [IL]</span></div>
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
  let filtered_insts = []
  for (const group_path in insts) {
    const inst = insts[group_path]
    inst_select.push({
      name: inst.name,
      value: group_path
    })
    filtered_insts.push(group_path)
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
      filtered_users: filtered_users,
      filtered_insts: filtered_insts,
    },
    methods: {
      filter: function(){
        let new_users = []
        let new_insts = []
        let selected = document.getElementById('filter').value
        if (selected == 'all') {
          for (const username in this.users) {
            new_users.push(username)
          }
          for (const group_path in insts) {
              new_insts.push(group_path)
          }
        } else {
          if (selected in this.insts) {
            new_users = this.insts[selected]['members'].slice()
            new_insts.push(selected)
          }
        }
        this.filtered_users = new_users
        this.filtered_insts = new_insts
      }
    }
  })
}
